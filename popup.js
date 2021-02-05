const api_key = '5f945b6848f4adc285196bd93e4ccd1f5f331351';
let language = {};
const url = chrome.runtime.getURL('languages.json');
/*(async () => {
    await fetch(url)
    .then(res => res.json())
    .then(data => language = data);
})();*/

var xhr = new XMLHttpRequest();
xhr.open("GET", url);
xhr.responseType = "json";
xhr.onload = () => {
    language = xhr.response;
    onloaded();
};
xhr.send();
//settings 예상 구도
//default_language: 기본 언어
//enable_subtitle: 자막 활성화 여부
//.. and more

function getUrlParams(url) {
    url = '?' + url.split('?')[1];
    var query = url.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

function onloaded() {
    console.log(language);  
    document.getElementById("FAQ").href = chrome.runtime.getURL("FAQ.html")   
    for(let i in Object.keys(language)){
        let e = language[Object.keys(language)[i]]
        let node = document.createElement("option");
        node.value = Object.keys(language)[i];
        node.style = "width: 95%; text-align: center; height: 20px;";
        node.text = e;
        document.getElementById("language").appendChild(node);
        document.getElementById("language").onchange = sel_language_change;
    }
    chrome.storage.local.get(null, function(result) {
        //console.log(result);
        if(result.default_language) {
            document.getElementById("language").value = result.default_language;
        }else{
            document.getElementById("language").value = "en";
        }
        if(result.enable_subtitle != undefined || result.enable_subtitle != null) {
            document.getElementById("is_enable").checked = result.enable_subtitle
        }
    });
    document.getElementById("is_enable").onclick = is_enable_change;
}

function is_enable_change() {
    let sel = document.getElementById("is_enable");
    let val = sel.checked;
    chrome.storage.local.set({
        'enable_subtitle': val
    });
    if(!val) {
        chrome.tabs.executeScript({
            code: `if(document.getElementById("custom-subtitle")) {
                let subtitle = document.getElementById("custom-subtitle");
                window.URL.revokeObjectURL(subtitle.src);
                subtitle.remove();
                //document.location.href.replace(/&t=[0-9]+/g,'') + '&t=' + Math.floor(document.getElementsByClassName('video-stream')[0].getCurrentTime());
            }`
        });
    }else{
        chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, subtitle_load);
    }
}

function subtitle_load(tabs) {
    let href = tabs[0].url;
    console.log(href);
    let objs;
    let xml  = new XMLHttpRequest();
    xml.open("GET", "https://amara.org/api/videos/?video_url=https://www.youtube.com/watch?v=" + getUrlParams(href).v);
    xml.setRequestHeader("X-api-key", api_key);
    xml.responseType = "json";
    let lang = document.getElementById("language").value;
    xml.onload = () => {
        objs = xml.response.objects;
        if(objs.length != 0) {
            let e = objs[0];
            let index = e.languages.findIndex((e) => e.code == lang);
                if(index != -1) {
                    console.log('match language found!')
                    chrome.tabs.executeScript(tabs.id, {
                        code: `if(document.getElementById("custom-subtitle")) {
                            let subtitle = document.getElementById("custom-subtitle");
                            window.URL.revokeObjectURL(subtitle.src);
                            subtitle.remove();
                            //document.location.href.replace(/&t=[0-9]+/g,'') + '&t=' + Math.floor(document.getElementsByClassName('video-stream')[0].getCurrentTime());
                        }
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", "https://amara.org/api/videos/${e.id}/languages/${document.getElementById("language").value}/subtitles/?format=vtt");
                        xhr.setRequestHeader("X-api-key", "${api_key}");
                        xhr.onload = () => {
                            var node = document.createElement("track");
                            var data_url = window.URL.createObjectURL(new Blob([xhr.response], {type: "text/vtt"}));
                            node.src = data_url;
                            node.style = "margin-bottom: 10px";
                            node.kind = "subtitles";
                            node.id = "custom-subtitle";
                            node.srclang="${lang}";
                            node.default = true;
                            node.label = "${language[lang]}";
                            node.mode = "showing";
                            document.getElementsByClassName("video-stream")[0].append(node);
                        };
                        xhr.send();`
                    });
                }else{
                    console.log('match language not found, language: ' + lang)
                    chrome.tabs.executeScript(tabs.id, {
                        code: `if(document.getElementById("custom-subtitle")) {
                            let subtitle = document.getElementById("custom-subtitle");
                            window.URL.revokeObjectURL(subtitle.src);
                            subtitle.remove();
                            //document.location.href = document.location.href.replace(/&t=[0-9]+/g,'') + '&t=' + Math.floor(document.getElementsByClassName('video-stream')[0].getCurrentTime());
                        }`
                    })
                }

        }else{
            console.log('no have search result')
            chrome.tabs.executeScript(tabs.id, {
                code: `if(document.getElementById("custom-subtitle")) {
                    let subtitle = document.getElementById("custom-subtitle");
                    window.URL.revokeObjectURL(subtitle.src);
                    subtitle.remove();
                    //document.location.href = document.location.href.replace(/&t=[0-9]+/g,'') + '&t=' + Math.floor(document.getElementsByClassName('video-stream')[0].getCurrentTime());
                }`
            });
        }
    };
    xml.send();
}

function sel_language_change() {
    let sel = document.getElementById("language");
    let val = sel.options[sel.selectedIndex].value;
    chrome.storage.local.set({
        'default_language': val
    });
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, subtitle_load);
}