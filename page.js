if (!document.hasRun) {
    // add listener only once!
    console.log('onMessage listener added');
    chrome.runtime.onMessage.addListener(messageListener);
    document.hasRun = true;

    var divTag = document.createElement('div');
    divTag.className = 'popup';
    divTag.setAttribute('data-popup', 'popup-1');
    document.body.appendChild(divTag);

    var divInnerTag = document.createElement('div');
    divInnerTag.className = 'popup-inner';
    divTag.appendChild(divInnerTag);

    // contains text..
    var divContentsTag = document.createElement('div');
    divInnerTag.appendChild(divContentsTag);

    var aTag = document.createElement('a');
    aTag.className = 'popup-close';
    aTag.id = 'a123456789';
    aTag.href = '#';
    aTag.innerText = 'x'
    divInnerTag.appendChild(aTag);

    $(function () {
        var elem = $('#a123456789');
        console.log('elem:', elem);
        $('#a123456789').on('click', function (e) {
            //alert('clicked!');
            $('[data-popup]').fadeOut(100);
            e.preventDefault();
        });

        console.log('___ popup handlers intialized 2');
    });

    $(document).keydown(function (e) {
        // ESCAPE key pressed
        if (e.keyCode == 27) {
            console.log('ESC pressed');
            $('[data-popup]').fadeOut(350);
        }
    });

    console.log('texarea created!')
} else {
    console.log('__ already ran!');
}

// function that waits for commands from background extension worker
function messageListener(request, sender, sendResponse) {
    console.log('messageListener');

    if (request.type === "isSetChromeTitle")
        handleOverrideWebTitle(request);

    else if (request.type === "isShowContextMenu")
        handleShowContextMenuData(request);
}

function handleShowContextMenuData(request) {
    //alert('showPopup5');
    var popup = $('[data-popup]');

    var funcEvaluation = eval(request.config.func);
    console.log('funcEvaluation=', funcEvaluation);
    divContentsTag.innerHTML = "";

    funcEvaluation.map(function (item) {
        var pTag = document.createElement('p');
        divContentsTag.appendChild(pTag);
        pTag.innerText = item;
    });

    popup.fadeIn(100);
}

function handleOverrideWebTitle(request) {
    try {
        console.log('incoming command: ' + JSON.stringify(request));

        var fullTitle = '';
        if (request.config.text)
            fullTitle = request.config.text;

        else if (request.config.func)
            fullTitle = eval(request.config.func);

        if (request.config.isAppendCurrent) {
            var titleSplit = document.title.split(' • ');
            var originalTitle = titleSplit.length > 1 ? titleSplit[1] : titleSplit[0];
            fullTitle += ' • ' + originalTitle;
        }

        setInterval(function () {
            if (document.title !== fullTitle)
                document.title = fullTitle;
        }, 100);
    }
    catch (err) {
        console.log('500 error: ' + err.message);
        console.log(err);
        data.error_code = 500;
        data.error_message = err.message;
    }
}