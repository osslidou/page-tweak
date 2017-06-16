var inputs = {};

document.addEventListener('DOMContentLoaded', function () {
    afterPageLoaded();
});

function afterPageLoaded() {
    inputs.rules_text = document.getElementById('rules_text');
    inputs.functions_text = document.getElementById('functions_text');
    inputs.rules_url = document.getElementById('rules_url');
    inputs.functions_url = document.getElementById('functions_url');

    attachTextChanged(inputs.rules_url, 'rules', handleReloadSingleFile);
    attachTextChanged(inputs.functions_url, 'functions', handleReloadSingleFile);
    attachTextChanged(inputs.rules_text, 'rules', handleOverrideConfig);
    attachTextChanged(inputs.functions_text, 'functions', handleOverrideConfig);

    chrome.runtime.sendMessage({ cmd: 'get' }, function (response) {
        var config = response.config;

        inputs.rules_text.value = config.rules_text;
        inputs.functions_text.value = config.functions_text;
        inputs.rules_url.value = config.rules_url;
        inputs.functions_url.value = config.functions_url;

        textareaAdjust(inputs.rules_text);
        textareaAdjust(inputs.functions_text);

        handleReloadSingleFile('rules', config.rules_url);
        handleReloadSingleFile('functions', config.functions_url);
    });
}

function attachTextChanged(control, type, handler) {
    control.addEventListener('input', function (e) {
        handler(type, e.target.value);
    }, false);
}

function handleOverrideConfig(type, configText) {
    sendConfigUpdate(type, null, configText);
}

function handleReloadSingleFile(type, url) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", url, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            var text = rawFile.responseText;
            sendConfigUpdate(type, url, text);
            var field = (type === 'rules' ? inputs.rules_text : inputs.functions_text);
            field.value = text;
            textareaAdjust(field);
        }
    }
    rawFile.send(null);
}

function sendConfigUpdate(type, url, text) {
    chrome.runtime.sendMessage({
        cmd: 'update',
        type: type,
        url: url,
        text: text
    });
}

function textareaAdjust(textarea) {
    textarea.style.height = "1px";
    textarea.style.height = (25 + textarea.scrollHeight) + "px";
}

/*
chrome.tabs.create({ url: "https://www.google.ca/search?q=hootsuite" });
chrome.tabs.create({ url: "chrome://extensions" });
*/

