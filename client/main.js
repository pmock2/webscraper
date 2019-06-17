var title;
var info;

function submit() {
    var firstName = document.querySelector('#first-name-query').value;
    var lastName = document.querySelector('#last-name-query').value;
    var DOBDay = document.querySelector('#dob-day').value;
    var DOBMonth = document.querySelector('#dob-month').value;
    var DOBYear = document.querySelector('#dob-year').value;

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

    var sendObj = {
        "firstName": firstName,
        "lastName": lastName,
        "DOBDay": DOBDay,
        "DOBMonth": DOBMonth,
        "DOBYear": DOBYear
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

function showScreenshotPage() {
    info.innerText = 'Use the button to show/hide the screenshot, then input the captcha in the space below. Click "Submit" to continue.';
    title.innerText = 'Input Captcha';

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
            
    var result = document.createElement("DIV");
    console.log(XHR.responseText);
    
    var innerHTML = `
        <div>
            <div class="row w-25">
                <div class="col">Column</div>
            </div>
            <div class="row w-25">
                <div class="col">Column</div>
            </div>
            <div class="row w-25">
                <div class="col">Column</div>
            </div>
            <div class="row w-25">
                <div class="col">Column</div>
            </div>
            <div class="row w-25">
                <div class="col">Column</div>
            </div>
        </div>
    `;
    
    
    result.innerHTML = XHR.responseText;
            
    document.body.append(result);
}