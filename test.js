const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var headless = false

var result = {
    'match' : false,
    'charges' : {
        
    },
    'caseno' : '',
    
}

//scraping data
let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: headless
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1500,
        height: 1000
    });
    await page.goto('https://www2.miami-dadeclerk.com/CJIS/CaseSearch.aspx?AspxAutoDetectCookieSupport=1');

    // Scrape

    await page.click('#tab4defaultheader');

    await page.waitFor(500);

    await page.type('#txtDefendantFirstName', 'JOHN');
    await page.type('#txtDefendantLastName', 'SMITH');
    
    //03/03/1944
    await page.type('#txtDefendantDOB1', '12');
    await page.type('#txtDefendantDOB2', '09');
    await page.type('#txtDefendantDOB3', '1957');
    
    await page.evaluate(() => {
        document.querySelector('#ddlDefendantSex').options[1].selected = true;
    });

    var waitForCaptcha = new Promise((resolve, reject) => {
        rl.question('Input captcha then hit enter to continue', (answer) => {
            rl.close();
            resolve(true);
        });
    });
    
    await waitForCaptcha;
    
    await page.click('#btnNameSearch');
    
    await page.waitFor(5000);
    
    var records = await page.evaluate(() => {
        return document.querySelector('#lblDefendants1').innerHTML;
    });
    
    for (var i = 1; i < parseInt(records) + 1; i++) {
        var DOB = ''
        
        var select = `.table-condensed tbody tr:nth-child(${i}) td button`;
        await page.click(select);
        await page.waitFor(1000000);
    }

    browser.close();
    return true;
};

scrape().then((value) => {
    console.log(value); // Success!
}).catch((err) => {
    console.log(err);
});