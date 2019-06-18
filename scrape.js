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

var result = {
    match: false,
    cases: {}
}

let init = async () => {
    print('Initializing Puppeteer...', true);
    browser = await puppeteer.launch({
        headless: headless
    });

    page = await browser.newPage();

    await page.setViewport({
        width: 1500,
        height: 1000
    });

    await page.goto('https://www2.miami-dadeclerk.com/CJIS/CaseSearch.aspx?AspxAutoDetectCookieSupport=1');

    print('Done.', true);
}

//scraping data
let runSearchToCaptcha = async (caseInfo) => {
    info = caseInfo;

    print('Starting search...', true);

    print(info, true);

    await page.click('#tab4defaultheader');

    await page.waitFor(1000);

    await page.type('#txtDefendantFirstName', info.first);
    await page.type('#txtDefendantLastName', info.last);
    await page.type('#txtDefendantDOB1', info.DOB.month);

    await page.click('#txtDefendantDOB2');

    await page.evaluate(() => {
        document.querySelector('#txtDefendantDOB2').value = '';
    });

    await page.type('#txtDefendantDOB2', info.DOB.day);
    await page.type('#txtDefendantDOB3', info.DOB.year);

    await page.evaluate(() => {
        document.querySelector('#ddlDefendantSex').options[1].selected = true;
    });

    return getCaptchaPic(page);
}

async function getCaptchaPic(page) {
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

        goodCaptcha = true;
    }

    if (goodCaptcha) {
        return runSearchPostCaptcha();
    } else {

        await getCaptchaPic(page);
        throw 'Invalid Captcha';
    }
}

let runSearchPostCaptcha = async () => {
    // var waitForCaptcha = new Promise((resolve, reject) => {
    //     rl.question('Input Captcha value from the captcha.png file...\n', (answer) => {
    //         rl.close();
    //         resolve(answer);
    //     });
    // });

    // var captchaText = await waitForCaptcha;

    print('Waiting for defendants...', true);

    try {
        await page.waitFor('#lblDefendants1', {
            timeout: 10000
        });
    } catch (error) {
        await getCaptchaPic(page);
        throw error;
    }

    print('Grabbing records count...', true);
    var records = await page.evaluate(() => {
        return document.querySelector('#lblDefendants1').innerHTML;
    });

    print('Looping through records...', true);
    for (var i = 1; i < parseInt(records) + 1; i++) {
        await page.waitFor('#form1 > div.container > div:nth-child(12) > div > div > table > tbody > tr:nth-child(1) > td:nth-child(7)');

        var DOB = await page.evaluate(x => {
            var DOBElement = document.querySelector(`#form1 > div.container > div:nth-child(12) > div > div > table > tbody > tr:nth-child(${x}) > td:nth-child(7)`);
            return DOBElement.innerHTML;
        }, i);

        var DOBSplit = DOB.split('/');

        if (DOBSplit[0] === info.DOB.month && DOBSplit[1] === info.DOB.day && DOBSplit[2] === info.DOB.year) {
            print('Found matching DOB', true);
            result.match = true;

            var select = `.table-condensed tbody tr:nth-child(${i}) td button`;

            await page.click(select);

            await page.waitFor('#lblCases');

            var caseCount = await page.evaluate(() => {
                return parseInt(document.querySelector('#lblCases').innerHTML);
            });

            for (var j = 0; j < caseCount; j++) {
                //click on that row's details
                await page.click(`#form1 > div.container > div:nth-child(11) > div > div > table > tbody > tr:nth-child(${j+2}) > td:nth-child(1) > button`);

                await page.waitFor('#lblCaseNumber');

                //grab the case no
                var caseNo = await page.evaluate(() => {
                    return document.querySelector('#lblCaseNumber').innerHTML;
                });

                print(`Case Number : ${caseNo}`, true);

                result.cases[caseNo] = {};

                //grab the file date
                var fileDate = await page.evaluate(() => {
                    return document.querySelector('#lblDateFiled').innerHTML;
                });

                print(`File Date : ${fileDate}`, true);

                result.cases[caseNo].fileDate = fileDate;

                result.cases[caseNo].charges = {};

                var chargeCount = await page.evaluate(() => {
                    return parseInt(document.querySelector('#lblTotalofCharges').innerHTML);
                });

                for (var k = 0; k < chargeCount; k++) {
                    var charge = await page.evaluate(x => {
                        return document.querySelector(`#pnlCharges > div > div > div > div.panel-body > table > tbody > tr:nth-child(${x+2}) > td:nth-child(2)`).innerHTML;
                    }, k);

                    print(`Charge ${k+1} : ${charge}`, true);

                    result.cases[caseNo].charges[k] = {};

                    result.cases[caseNo].charges[k].charge = charge;

                    var chargeType = await page.evaluate(x => {
                        return document.querySelector(`#pnlCharges > div > div > div > div.panel-body > table > tbody > tr:nth-child(${x+2}) > td:nth-child(3)`).innerHTML;
                    }, k);

                    print(`Charge Type ${k+1} : ${chargeType}`, true);

                    result.cases[caseNo].charges[k].chargeType = chargeType;
                }
                await page.click('#lnkCases');
            }

            await page.waitFor(1000);

            await page.click('#lnkDefendants');

        } else {
            print('DOB does not match', true);
        }
    }

    print('Finished.', true);
    print('Sending results...', true);

    browser.close();

    result.first = info.first;
    result.last = info.last;
    result.DOB = info.DOB;

    print(result, true);

    return result;
}

function print(text, debug) {
    if (debug && debugMode) {
        console.log(text);
        console.log('');
    }
    if (!debug) {
        console.log(text);
        console.log('');
    }
};

module.exports = {
    runSearchToCaptcha: runSearchToCaptcha,
    runSearchPostCaptcha: runSearchPostCaptcha,
    init: init,
    tryCaptcha: tryCaptcha,
};