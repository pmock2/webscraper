const express = require('express');
const bodyParser = require('body-parser');
const scrape = require('./scrape');


var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json())

//serve up static content
app.use('/', express.static('client'));

//start the server
app.listen(8080, () => {
    console.log(`Server started on port 8080`);
});

//post captcha string
app.post('/captcha', (req, res) => {
    var captchaText = req.body.captchaText;
    scrape.tryCaptcha(captchaText).then((result) => {
        res.status(200).send(result);
    }).catch((err) => {
        print(err);
        if ((err + '').includes('INVALID CAPTCHA ERROR')) {
            res.status(400).send(err);
            return;
        }
        res.status(500).send(err + '');
    });
});

//start puppeteer session
app.get('/init', async (req, res) => {
    await  scrape.init();
    res.status(200).send('Started server');
});

//start the subject search
app.post('/start', (req, res) => {
    var infoObject = {
        first: req.body.firstName,
        last: req.body.lastName,
        DOB: {
            day: req.body.DOBDay,
            month: req.body.DOBMonth,
            year: req.body.DOBYear,
        },
        sex: req.body.sex
    }

    scrape.runSearchToCaptcha(infoObject).then(() => {
        res.status(200).send();
    }).catch((err) => {
        print(err);
        res.status(500).send(err);
    });
});


function print(text, debug) {
    if (debug && debugMode) {
        console.log(text);
    }
    if (!debug) {
        console.log(text);
    }
};