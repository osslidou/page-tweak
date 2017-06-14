var rules = [];
var functions_text;

var dep_page = {};
var dep_jquery = {};

const DEFAULT_URLS_CONFIG = "https://gist.githubusercontent.com/osslidou/d5e28dddc79f19a25f118588c9df5095/raw/urls.js";
const DEFAULT_FUNCTIONS_CONFIG = "https://gist.githubusercontent.com/osslidou/6832485d36a15a53d00ff60178742fb9/raw/functions.js";

// context menu
var contextMenuId = chrome.contextMenus.create({ "title": "Page Tweak", "contexts": ["all"], "onclick": contextMenuOnClick });
function contextMenuOnClick(info, tab) {
    getMatchingRuleAndRun(tab.id, function (rule) {
        var request = {};
        request.type = "isShowContextMenu";
        request.config = rule.contextMenu;
        chrome.tabs.sendMessage(tab.id, request);
    });
}

// config page
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.runtime.openOptionsPage();
});

// stored config
chrome.storage.sync.get('config', function (items) {
    var config = items['config'];

    if (config === undefined) {
        config = {};
        config.rules_url = DEFAULT_URLS_CONFIG;
        config.functions_url = DEFAULT_FUNCTIONS_CONFIG;
    }

    updateGlobalsFromConfig(config);
    chrome.tabs.onUpdated.addListener(injectDependenciesAfterPageLoaded);
    chrome.tabs.onActivated.addListener(afterActivePageChanged);

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            switch (request.cmd) {
                case 'get':
                    var response = {};
                    response.config = config;
                    sendResponse(response);
                    break;

                case 'update':
                    switch (request.type) {
                        case 'rules':
                            config.rules_url = request.url;
                            config.rules_text = request.text;
                            break;
                        case 'functions':
                            config.functions_url = request.url;
                            config.functions_text = request.text;
                            break;
                    }

                    updateGlobalsFromConfig(config);
                    chrome.storage.sync.set({ 'config': config });
                    break;
            }

            return true;
        });
});

// main page-tweak logic
function afterTabUpdated(tabId) {
    chrome.contextMenus.update(contextMenuId, { "enabled": false });

    getMatchingRuleAndRun(tabId, function (rule, tabUrl) {
        if (rule.contextMenu) {
            chrome.contextMenus.update(contextMenuId, { "enabled": true, "title": rule.contextMenu.title });
        }

        if (rule.tweakTitle) {
            if (dep_jquery[tabId] === tabUrl && dep_page[tabId] === tabUrl) {
                var request = {};
                request.type = "isSetChromeTitle";
                request.config = rule.tweakTitle;
                chrome.tabs.sendMessage(tabId, request);
            } else
                setTimeout(function () {
                    console.log('___ delay restart send message');
                    afterTabUpdated(tabId);
                }, 250);
        }
    });
}

function getMatchingRuleAndRun(tabId, cb) {
    chrome.tabs.get(tabId, function (tab) {
        var request = {};
        rules.some(function (rule) {
            console.log('rule url:' + rule.url + ' current url:' + tab.url);
            if (isMatchRule(tab.url, rule.url)) {
                console.log('match!: ' + JSON.stringify(rule));
                cb(rule, tab.url);
                return true;
            }
        });
    });
}

function isMatchRule(str, rule) {
    return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
}

function injectDependenciesAfterPageLoaded(tabId, changeInfo, tab) {
    if (tab.url.startsWith("chrome://"))
        return;

    console.log('changeInfo.status: ' + changeInfo);
    if (changeInfo.status === "loading" || changeInfo.status === "complete") {
        injectScriptsIntoTab(tabId, true);
    }
}

function injectScriptsIntoTab(tabId, forceInject) {
    console.log("injectScriptsIntoTab:", tabId);
    chrome.tabs.get(tabId, function (tab) {
        console.log("tab:", tab);
        console.log("tab.url:", tab.url);
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))
            return;

        injectJqueryIfNeeded(tab, forceInject, function () {
            injectPageJsIfNeeded(tab, forceInject, function () {
                chrome.tabs.executeScript(tab.id, { code: functions_text }, function () {
                    chrome.tabs.insertCSS(tab.id, {
                        file: "styles.css"
                    }, function () {
                        afterTabUpdated(tab.id);
                    });

                });
            });
        });
    });
}

function injectJqueryIfNeeded(tab, forceInject, callback) {
    if (forceInject || dep_jquery[tab.id] !== tab.url) {
        chrome.tabs.executeScript(tab.id, { file: "jquery-3.1.1.min.js" }, function () { callback(); });
        dep_jquery[tab.id] = tab.url;
        console.log('dep_jquery:[%s] = %s', tab.id, tab.url);
    } else {
        callback();
    }
}

function injectPageJsIfNeeded(tab, forceInject, callback) {
    if (forceInject || dep_page[tab.id] !== tab.url) {
        chrome.tabs.executeScript(tab.id, { file: "page.js" }, function () { callback(); });
        dep_page[tab.id] = tab.url;
        console.log('dep_page:[%s] = %s', tab.id, tab.url);
    } else {
        callback();
    }
}

function updateGlobalsFromConfig(config) {
    try {
        rules = JSON.parse(config.rules_text);
        functions_text = config.functions_text;
    } catch (ex) { }
}

function afterActivePageChanged(activeInfo) {
    injectScriptsIntoTab(activeInfo.tabId, false);
}

/*
chrome.tabs.create({ url: "chrome://extensions" });
chrome.tabs.create({ url: "http://hootsuite.com" });
*/