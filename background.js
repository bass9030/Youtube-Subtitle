const api_key = '5f945b6848f4adc285196bd93e4ccd1f5f331351';

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
const url = chrome.runtime.getURL('languages.json');
let languages;
var xhr = new XMLHttpRequest();
xhr.open("GET", url, false);
xhr.send();
languages = JSON.parse(xhr.responseText);

function delay(ms) {
    let start = new Date().getTime()
    while(new Date().getTime() - start <= ms) {
        console.log('.');
    }
}

function removeSubtitle(id) {
    delay(1500);
    chrome.tabs.executeScript(id, {
        code: `if(document.getElementById("custom-subtitle")) {
            console.log('work')
            let subtitle = document.getElementById("custom-subtitle");
            let video = document.getElementsByClassName('video-stream')[0]
            window.URL.revokeObjectURL(subtitle.src);
            video.removeChild(video.children[0]);
        }`
    })
}

function insertSubtitle(id, vid, language) {
    chrome.tabs.executeScript(id, {
        code: `if(document.getElementById("custom-subtitle")) {
            console.log('work')
            let subtitle = document.getElementById("custom-subtitle");
            window.URL.revokeObjectURL(subtitle.src);
            subtitle.remove();
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://amara.org/api/videos/${vid}/languages/${language}/subtitles/?format=vtt");
        xhr.setRequestHeader("X-api-key", "${api_key}");
        xhr.onload = () => {
            console.log("no custom subtitle")
            var node = document.createElement("track");
            var data_url = window.URL.createObjectURL(new Blob([xhr.response], {type: "text/vtt"}));
            node.src = data_url;
            node.kind = "subtitles";
            node.id = "custom-subtitle";
            node.srclang="${language}";
            node.default = true;
            node.label = "${languages[language]}";
            node.mode = "showing";
            document.getElementsByClassName("video-stream")[0].append(node);
        };
        xhr.send();`
    })
}

chrome.webNavigation.onCompleted.addListener(function(details) {
    let href = details.url;
    let id = details.tabId;
    if(!href) return;
    if(!href.match(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g)) return;
    chrome.storage.local.get(null, function(result) {
        if(!result.enable_subtitle) return;
        let language;
        if(result.default_language) {
            language = result.default_language;
        }else{
            language = "en";
        }
        console.log('onCompleted');
        let objs;
        let xml  = new XMLHttpRequest();
        xml.open("GET", "https://amara.org/api/videos/?video_url=https://www.youtube.com/watch?v=" + getUrlParams(href).v);
        xml.setRequestHeader("X-api-key", api_key);
        xml.responseType = "json";
        xml.onreadystatechange = () => {
            if(xml.readyState != 4) return;
            if(xml.status != 200) return;
            console.log(xml.response);
            objs = xml.response.objects;
            if(objs.length != 0) {
                objs.forEach((e) => {
                    let index = e.languages.findIndex((e) => e.code == language);
                    if(index != -1) {
                        console.log('language found!');
                        insertSubtitle(id, e.id, language);
                    }else{
                        console.log('language not found!');
                        removeSubtitle(id);
                    }
                })
            }else{
                console.log('not have in search result');
                removeSubtitle(id);
            }
        };
        xml.send();
    });
});

chrome.tabs.onUpdated.addListener(function(id, changeInfo, _) {
    console.log(changeInfo.url);
    let href = changeInfo.url;
    if(!href) return;
    if(!href.match(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g)) return;
    chrome.storage.local.get(null, function(result) {
        if(!result.enable_subtitle) return;
        let language;
        if(result.default_language) {
            language = result.default_language;
        }else{
            language = "en";
        }
        console.log('onUpdated');
        let objs;
        let xml  = new XMLHttpRequest();
        xml.open("GET", "https://amara.org/api/videos/?video_url=https://www.youtube.com/watch?v=" + getUrlParams(href).v);
        xml.setRequestHeader("X-api-key", api_key);
        xml.responseType = "json";
        xml.onreadystatechange = () => {
            if(xml.readyState != 4) return;
            if(xml.status != 200) return;
            console.log(xml.response);
            objs = xml.response.objects;
            if(objs.length != 0) {
                objs.forEach((e) => {
                    let index = e.languages.findIndex((e) => e.code == language);
                    if(index != -1) {
                        console.log('language found!');
                        insertSubtitle(id, e.id, language);
                    }else{
                        console.log('language not found!');
                        removeSubtitle(id);
                    }
                })
            }else{
                console.log('not have in search result');
                removeSubtitle(id);
            }
        };
        xml.send();
    });
});