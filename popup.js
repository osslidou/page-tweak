function show() {
    chrome.runtime.sendMessage({ cmd: 'get' }, function (response) {
        var config = response.config;

        var rules_text = document.getElementById('rules_text');
        var functions_text = document.getElementById('functions_text');
        var rules_url = document.getElementById('rules_url');
        var functions_url = document.getElementById('functions_url');

        rules_text.value = config.rules_text;
        functions_text.value = config.functions_text;
        rules_url.value = config.rules_url;
        functions_url.value = config.functions_url;

        textareaAdjust(rules_text);
        textareaAdjust(functions_text);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    show();

    var rules_url = document.getElementById('rules_url');
    var functions_url = document.getElementById('functions_url');

    rules_url.addEventListener('input', function (e) {
        handleLoad('rules', e.target.value);
    }, false);

    functions_url.addEventListener('input', function (e) {
        handleLoad('functions', e.target.value);
    }, false);
});

function handleLoad(type, target) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", target, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            chrome.runtime.sendMessage({
                cmd: 'update',
                type: type,
                text: rawFile.responseText,
                url: target
            });
            show();
        }
    }
    rawFile.send(null);
}

function textareaAdjust(textarea) {
    textarea.style.height = "1px";
    textarea.style.height = (25 + textarea.scrollHeight) + "px";
}

/*
chrome.tabs.create({ url: "https://www.google.ca/search?q=hootsuite" });
chrome.tabs.create({ url: "chrome://extensions" });
*/

