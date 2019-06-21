var title;
var info;

document.addEventListener('DOMContentLoaded', startPuppeteer, false);

function submit() {
    var firstName = document.querySelector('#first-name-query').value;
    var lastName = document.querySelector('#last-name-query').value;
    var DOBDay = document.querySelector('#dob-day').value;
    var DOBMonth = document.querySelector('#dob-month').value;
    var DOBYear = document.querySelector('#dob-year').value;
    var sex = document.querySelector('#dropdownMenuButton').innerHTML;

    if (firstName === '') {
        alert('Please fill out First Name field');
        return;
    }

    if (lastName === '') {
        alert('Please fill out Last Name field');
        return;
    }

    if (DOBDay === '') {
        alert('Please fill out DOB-Day field');
        return;
    }

    if (DOBMonth === '') {
        alert('Please fill out DOB-Month field');
        return;
    }

    if (DOBYear === '') {
        alert('Please fill out DOB-Year field');
        return;
    }

    if (sex === 'sex') {
        alert('Please choose a subject sex');
    }

    var sendObj = {
        "firstName": firstName,
        "lastName": lastName,
        "DOBDay": DOBDay,
        "DOBMonth": DOBMonth,
        "DOBYear": DOBYear,
        "sex": sex.toLowerCase()
    }

    document.querySelector('.query-input-group').remove();
    info = document.querySelector('.subtitle');
    info.innerText = 'Running Search...';

    title = document.querySelector('#title');
    title.innerText = 'Search Submitted';

    var XHR = new XMLHttpRequest();

    XHR.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            showScreenshotPage();
        }
    }

    XHR.open("POST", '/start');
    XHR.setRequestHeader('Content-type', 'application/json');
    XHR.send(JSON.stringify(sendObj));
}

function showScreenshotPage(error) {
    info.innerText = 'Use the button to show/hide the screenshot, then input the captcha in the space below. Click "Submit" to continue.';
    title.innerText = 'Input Captcha';

    if (error) {
        title.innerText = 'Captcha Error';
    }

    //create the iframe to show the captcha
    var captcha = document.createElement("IFRAME");
    captcha.src = 'http://' + window.location.host + '/captcha.png';
    captcha.seamless = true;
    captcha.width = 1550;
    captcha.height = 1050;
    captcha.style.display = 'none';

    //create show/hide button
    var showHideButton = document.createElement('BUTTON');
    showHideButton.innerText = 'Show/Hide Captcha Screenshot';
    showHideButton.classList.add('btn', 'btn-primary', 'btn-sm', 'submit-button');
    showHideButton.addEventListener('click', showHideIframe);

    //create captcha input
    var captchaInput = document.createElement('INPUT');
    captchaInput.type = 'text';
    captchaInput.id = 'captcha-input'
    captchaInput.classList.add('form-control', 'w-25');
    captchaInput.placeholder = 'Captcha Value';

    //create submit button
    var submitCaptcha = document.createElement('BUTTON');
    submitCaptcha.innerText = 'Submit Captcha';
    submitCaptcha.classList.add('btn', 'btn-primary', 'btn-sm', 'submit-button');
    submitCaptcha.addEventListener('click', postCaptcha);

    //create container
    var captchaInputContainer = document.createElement("DIV");
    captchaInputContainer.id = 'captcha-input-container';

    //append
    captchaInputContainer.append(showHideButton);
    captchaInputContainer.append(captchaInput);
    captchaInputContainer.append(submitCaptcha);
    captchaInputContainer.append(captcha);

    document.body.append(captchaInputContainer);
}

function showHideIframe() {
    var iframe = document.querySelector("#captcha-input-container > iframe");
    if (iframe.style.display === 'none') {
        iframe.style.display = 'block';
    } else {
        iframe.style.display = 'none';
    }
}

function postCaptcha() {
    var captchaInput = document.querySelector('#captcha-input').value;

    var sendObj = {
        captchaText: captchaInput
    }

    var XHR = new XMLHttpRequest();

    XHR.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            setResults(XHR);
        } else if (this.status === 400 && this.readyState === 4) {
            showScreenshotPage(true);
        } else if (this.status === 500 && this.readyState === 4) {
            while (document.body.firstChild !== null) {
                document.body.removeChild(document.body.firstChild);
            }

            document.body.innerHTML = XHR.responseText;
        }
    }

    XHR.open("POST", '/captcha');
    XHR.setRequestHeader('Content-type', 'application/json');
    XHR.send(JSON.stringify(sendObj));

    document.querySelector('#captcha-input-container').remove();

    info.innerText = 'Executing Defendant Search...';
    title.innerText = 'Running Query';
}

function setResults(XHR) {
    info.innerText = '';
    title.innerText = 'Results';

    var resultObj = JSON.parse(XHR.responseText);

    match = resultObj.match + '';
    first = resultObj.first + '';
    last = resultObj.last + '';
    DOB = resultObj.DOB;
    sex = resultObj.sex + '';
    cases = resultObj.cases;

    var container = newElement('DIV');

    var matchElement = newElement("DIV");
    matchElement.innerHTML = `<span class="result-key">Match : </span><span class="match-val">${match.toUpperCase()}</span>`;

    var firstElement = newElement("DIV");
    firstElement.innerHTML = `<span class="result-key">First Name : </span><span ">${first}</span>`;

    var lastElement = newElement("DIV");
    lastElement.innerHTML = `<span class="result-key">First Name : </span><span ">${last}</span>`;

    var DOBElement = newElement("DIV");
    DOBElement.innerHTML = `<span class="result-key">DOB : </span><span ">${DOB.month}/</span><span ">${DOB.day}/</span><span ">${DOB.year}</span>`;

    var sexElement = newElement("DIV");
    sexElement.innerHTML = `<span class="result-key">Sex : </span><span>${sex.toUpperCase()}</span>`;

    var hr = newElement("HR");

    container.append(matchElement);
    container.append(firstElement);
    container.append(lastElement);
    container.append(DOBElement);
    container.append(sexElement);
    container.append(hr);

    for (var i = 0; i < Object.keys(cases).length; i++) {
        var caseDrop = newElement("BUTTON");
        caseDrop.classList.add('btn', 'btn-primary', 'w-75', 'collapse-button');
        caseDrop.dataset.toggle = "collapse";
        caseDrop.dataset.target = `#case-info-${i}`;
        caseDrop.innerText = `Case ${i}`;

        var caseInfo = newElement('DIV');
        caseInfo.classList.add('collapse', 'card', 'w-75');
        caseInfo.id = `case-info-${i}`;

        var caseNumber = Object.keys(cases)[i];

        var caseNumberElement = newElement('DIV');
        caseNumberElement.innerHTML = `<span class="font-weight-bold">Case Number: </span><span>${caseNumber}</span>`;

        var fileDateElement = newElement('DIV');
        fileDateElement.innerHTML = `<span class="font-weight-bold">FileDate: </span><span>${cases[caseNumber].fileDate}</span>`;

        caseInfo.append(caseNumberElement);
        caseInfo.append(fileDateElement);

        var chargeTable = newElement('DIV');
        chargeTable.classList.add('charge-table');

        var chargeTableHeader = newElement("DIV");
        chargeTableHeader.innerHTML = `
            <div class="row">
                <div class="col font-weight-bold">Charge</div>
                <div class="col font-weight-bold">Charge Type</div>
                <div class="col font-weight-bold">Raw HTML</div>
            </div>
        `;

        chargeTable.append(chargeTableHeader);

        var charges = cases[caseNumber].charges;
        for (var j = 0; j < Object.keys(charges).length; j++) {
            var chargeRow = newElement("DIV");
            chargeRow.classList.add('row');
            chargeRow.innerHTML = `
                <div class="col">${charges[j].charge}</div>
                <div class="col">${charges[j].chargeType}</div>
                <div class='col'><button class="btn btn-primary btn-sm submit-button"></div>
            `
            chargeTable.append(chargeRow);
        }
        caseInfo.append(chargeTable);

        container.append(caseDrop);
        container.append(caseInfo);
    }
    document.body.append(container);

    var restartButton = newElement('BUTTON');
    restartButton.innerText = 'Run New Search';
    restartButton.classList.add('btn', 'btn-primary', 'btn-sm', 'submit-button');
    restartButton.addEventListener('click', startPuppeteer);

    document.body.append(restartButton);
}

function startPuppeteer() {
    var roller = newElement("DIV");
    roller.classList.add('roller-container');
    roller.innerHTML = `<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`;
    document.body.append(roller);

    var XHR = new XMLHttpRequest();

    XHR.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            console.log('Started Puppeteer');
            while (document.body.firstChild !== null) {
                document.body.removeChild(document.body.firstChild);
            }
            document.body.innerHTML = `
            <h2 id="title">Full Extract Proof of Concept</h2>

            <div class="subtitle">Use the following form to input case data</div>

            <div class="query-input-group">

                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="First Name" id="first-name-query" />
                </div>

                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="Last Name" id="last-name-query" />
                </div>

                <div class="input-group">
                    <div class="input-group-prepend">
                        <span class="input-group-text">DOB</span>
                    </div>
                    <input type="text" class="form-control" placeholder="Month" id="dob-month">
                    <input type="text" class="form-control" placeholder="Day" id="dob-day">
                    <input type="text" class="form-control" placeholder="Year" id="dob-year">
                </div>
                
                <div class="dropdown">
                    <button class="btn btn-info dropdown-toggle submit-button" type="button" id="dropdownMenuButton" data-toggle="dropdown">
                        Sex
                    </button>
                    
                    <div class="dropdown-menu">
                        <a class="dropdown-item" id="unspecified">Unspecified</a>
                        <a class="dropdown-item" id="male">Male</a>
                        <a class="dropdown-item" id="female">Female</a>
                    </div>
                    
                </div>
                <button type="button" class="btn btn-primary btn-sm submit-button" id="submit"
                    onclick="submit()">Submit</button>
            </div>
            `;

            for (const child of document.querySelector('.dropdown-menu').children) {
                child.addEventListener('click', () => {
                    document.querySelector('#dropdownMenuButton').innerHTML = child.innerHTML;

                });
            }
        }
    }

    XHR.open("GET", '/init');
    XHR.send();

}

function newElement(tag) {
    return document.createElement(tag);
}