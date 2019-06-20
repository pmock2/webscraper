const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var headless = true;
var debugMode = true;
var browser;
var page;
var info;
var css;

var result = {
    match: false,
    cases: {},
}

let init = async () => {
    print('Initializing Puppeteer...', true);
    browser = await puppeteer.launch({
        headless: headless
    });

    page = await browser.newPage();

    await page.setViewport({
        width: 1000,
        height: 800
    });

    print('Grabbing page CSS...');

    await page.goto('https://www2.miami-dadeclerk.com/CJIS/Content/cjis.css');

    css = await page.evaluate(() => {
        return document.querySelector("body > pre").innerHTML;
    });

    print('navigate to main court page...');
    await page.goto('https://www2.miami-dadeclerk.com/CJIS/CaseSearch.aspx?AspxAutoDetectCookieSupport=1');

    print('Done.', true);
    return new Promise((resolve, reject) => {
        resolve(true);
    });
}

//scraping data
let runSearchToCaptcha = async (caseInfo) => {
    info = caseInfo;

    print('Starting search...', true);

    print(info, true);

    print('clicking defendant tab...');
    await page.click('#tab4defaultheader');

    await page.waitFor(1000);

    print('Inputting defendant info...');
    await page.type('#txtDefendantFirstName', info.first);
    await page.type('#txtDefendantLastName', info.last);
    await page.type('#txtDefendantDOB1', info.DOB.month);

    await page.click('#txtDefendantDOB2');

    await page.evaluate(() => {
        document.querySelector('#txtDefendantDOB2').value = '';
    });

    await page.type('#txtDefendantDOB2', info.DOB.day);
    await page.type('#txtDefendantDOB3', info.DOB.year);

    await page.evaluate(info => {
        switch (info.sex) {
            case 'male':
                document.querySelector('#ddlDefendantSex').options[1].selected = true;
                break;
            case 'female':
                document.querySelector('#ddlDefendantSex').options[2].selected = true;
                break;
            case 'unspecified':
                document.querySelector('#ddlDefendantSex').options[3].selected = true;
                break;
            default:
                document.querySelector('#ddlDefendantSex').options[3].selected = true;
                break;
        }
    }, info);


    return getCaptchaPic(page);
}

async function getCaptchaPic(page) {
    print('Waiting for captcha info...');
    await page.click('#CaptchaCodeTextBox');
    return await page.screenshot({
        path: 'client/captcha.png'
    });
}

async function tryCaptcha(captchaText) {
    print('Running search post captcha...', true);

    print('Typing captcha text...', true);
    await page.type('#CaptchaCodeTextBox', captchaText);

    print('Clicking search...', true);
    await page.click('#btnNameSearch');

    var goodCaptcha = false;

    try {
        await page.click('#CaptchaCodeTextBox');
        goodCaptcha = false;
    } catch (error) {
        if ((error.message).includes('No node found for selector: #CaptchaCodeTextBox')) {
            goodCaptcha = true;
        } else {
            print(error);
        }
    }

    if (goodCaptcha) {
        return runSearchPostCaptcha();
    } else {
        await getCaptchaPic(page);
        throw 'Invalid Captcha';
    }
}

let runSearchPostCaptcha = async () => {
    print('Waiting for defendants...', true);
    try {
        await page.waitFor('#lblDefendants1', {
            timeout: 5000
        });
    } catch (error) {
        var clear = await page.evaluate(() => {
            var errorCard = document.querySelector('#lblSearchError');
            if (errorCard !== null && errorCard !== undefined) {
                var errorCardText = document.querySelector('#lblSearchError').innerHTML;
                return errorCardText === 'No defendants found for the criteria entered';
            }
            return false;
        });

        if (clear) {
            print('No matching criteria, clearing...', true);
            return finish();
        } else {
            print('Invalid captcha', true);
            await getCaptchaPic(page);
            throw 'INVALID CAPTCHA ERROR';
        }
    }

    print('Grabbing Defendants count...', true);
    var defendantsCount = await page.evaluate(() => {
        return document.querySelector('#lblDefendants1').innerHTML;
    });

    print('Looping through Defendants...', true);
    for (var i = 1; i < parseInt(defendantsCount) + 1; i++) {
        print('Waiting for subjects table...', true);
        await page.waitFor('#form1 > div.container > div:nth-child(12) > div > div > table > tbody > tr:nth-child(1) > td:nth-child(7)');

        print('Grabbing subject DOB...', true);
        var DOB = await page.evaluate(x => {
            var DOBElement = document.querySelector(`#form1 > div.container > div:nth-child(12) > div > div > table > tbody > tr:nth-child(${x}) > td:nth-child(7)`);
            return DOBElement.innerHTML;
        }, i);

        print('Grabbing subject sex...', true);
        var sex = await page.evaluate(x => {
            var sexElement = document.querySelector(`#form1 > div.container > div:nth-child(12) > div > div > table > tbody > tr:nth-child(${x}) > td:nth-child(6)`);
            return sexElement.innerHTML;
        }, i);

        var DOBSplit = DOB.split('/');

        if (DOBSplit[0] === info.DOB.month && DOBSplit[1] === info.DOB.day && DOBSplit[2] === info.DOB.year &&
            (info.sex[0] === sex[0].toLowerCase() || info.sex.toLowerCase() === 'unspecified')) {
            print('Found matching DOB and Sex', true);
            result.match = true;

            print('Clicking cases button...', true);
            await page.click(`.table-condensed tbody tr:nth-child(${i}) td button`);

            print('Waiting for cases page...', true);
            await page.waitFor('#lblCases');

            print('Getting case count..', true);
            var caseCount = await page.evaluate(() => {
                return parseInt(document.querySelector('#lblCases').innerHTML);
            });

            print(`Found ${caseCount} case(s)`, true);

            print('Looping through cases...', true);

            for (var j = 0; j < caseCount; j++) {

                var caseHTML = await page.evaluate(() => {
                    return document.body.innerHTML;
                });

                //click on that row's details
                print('Waiting for case button...', true);
                await page.waitFor(`#form1 > div.container > div:nth-child(11) > div > div > table > tbody > tr:nth-child(${j+2}) > td:nth-child(1) > button`);

                print('Clicking case button', true);
                await page.click(`#form1 > div.container > div:nth-child(11) > div > div > table > tbody > tr:nth-child(${j+2}) > td:nth-child(1) > button`);

                print('Waiting for case modal..', true);
                await page.waitFor('#lblCaseNumber');

                //grab the case no
                print('Extracting case number...', true);
                var caseNo = await page.evaluate(() => {
                    return document.querySelector('#lblCaseNumber').innerHTML;
                });

                print(`Case Number : ${caseNo}`, true);

                result.cases[caseNo] = {};

                result.cases[caseNo].html = caseHTML;

                //grab the file date
                print('Extracting File date...', true);
                var fileDate = await page.evaluate(() => {
                    return document.querySelector('#lblDateFiled').innerHTML;
                });

                print(`File Date : ${fileDate}`, true);

                result.cases[caseNo].fileDate = fileDate;

                result.cases[caseNo].charges = {};

                print('Getting charges count...', true);
                var chargeCount = await page.evaluate(() => {
                    return parseInt(document.querySelector('#lblTotalofCharges').innerHTML);
                });

                print(`Found ${chargeCount} charge(s)...`, true);
                print('Looping through charges...', true);

                for (var k = 0; k < chargeCount; k++) {
                    print('Getting charge...', true);
                    var charge = await page.evaluate(x => {
                        return document.querySelector(`#pnlCharges > div > div > div > div.panel-body > table > tbody > tr:nth-child(${x+2}) > td:nth-child(2)`).innerHTML;
                    }, k);

                    print(`Charge ${k+1} : ${charge}`, true);

                    result.cases[caseNo].charges[k] = {};
                    result.cases[caseNo].charges[k].charge = charge;

                    var chargeHTML = await page.evaluate(() => {
                        return document.body.innerHTML;
                    });
                    
                    result.cases[caseNo].charges[k].html = chargeHTML;
                    
                    print('Getting charge type...', true);

                    var chargeType = await page.evaluate(x => {
                        return document.querySelector(`#pnlCharges > div > div > div > div.panel-body > table > tbody > tr:nth-child(${x+2}) > td:nth-child(3)`).innerHTML;
                    }, k);

                    print(`Charge Type ${k+1} : ${chargeType}`, true);

                    result.cases[caseNo].charges[k].chargeType = chargeType;
                }

                print('Going back to case list...', true);
                await page.click('#lnkCases');
            }

            print('Going back to defendants list...', true);
            
            await page.waitFor('#lnkDefendants');

            await page.click('#lnkDefendants');

        } else {
            print('DOB or sex does not match', true);
        }
    }

    return finish();
}

function finish() {
    print('Finished.', true);
    print('Sending results...', true);

    browser.close();

    result.first = info.first;
    result.last = info.last;
    result.DOB = info.DOB;
    result.sex = info.sex;

    print(result, true);
    return result;
}

function print(text, debug) {
    if (debug && debugMode) {
        console.log(text);
    }
    if (!debug) {
        console.log(text);
    }
};

module.exports = {
    runSearchToCaptcha: runSearchToCaptcha,
    runSearchPostCaptcha: runSearchPostCaptcha,
    init: init,
    tryCaptcha: tryCaptcha,
};