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
xhr.open("GET", url);
xhr.responseType = "json";
xhr.onload = () => {
    languages = xhr.response;
};
xhr.send();

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
        let objs;
        let xml  = new XMLHttpRequest();
        xml.open("GET", "https://amara.org/api/videos/?video_url=https://www.youtube.com/watch?v=" + getUrlParams(href).v);
        xml.setRequestHeader("X-api-key", api_key);
        xml.responseType = "json";
        xml.onload = () => {
            objs = xml.response.objects;
            if(objs.length != 0) {
                objs.forEach((e) => {
                    let index = e.languages.findIndex((e) => e.code == language);
                    if(index != -1) {
                        console.log('language found!');
                        chrome.tabs.executeScript(id, {
                            code: `if(document.getElementById("custom-subtitle")) {
                                let subtitle = document.getElementById("custom-subtitle");
                                window.URL.revokeObjectURL(subtitle.src);
                                //document.location.href = document.location.href.replace(/&t=[0-9]+/g,'') + '&t=' + Math.floor(document.getElementsByClassName('video-stream')[0].getCurrentTime());
                            }
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", "https://amara.org/api/videos/${e.id}/languages/ko/subtitles/?format=vtt");
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
                    }else{
                        console.log('language not found!');
                        chrome.tabs.executeScript(id, {
                            code: `if(document.getElementById("custom-subtitle")) {
                                let subtitle = document.getElementById("custom-subtitle");
                                window.URL.revokeObjectURL(subtitle.src);
                                subtitle.remove();
                                //document.location.href = document.location.href.replace(/&t=[0-9]+/g,'') + '&t=' + Math.floor(document.getElementsByClassName('video-stream')[0].getCurrentTime());
                            }`
                        })
                    }
                })
            }else{
                console.log('not have in search result');
                chrome.tabs.executeScript(id, {
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
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, _) {
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
        let objs;
        let xml  = new XMLHttpRequest();
        xml.open("GET", "https://amara.org/api/videos/?video_url=https://www.youtube.com/watch?v=" + getUrlParams(href).v);
        xml.setRequestHeader("X-api-key", api_key);
        xml.responseType = "json";
        xml.onload = () => {
            objs = xml.response.objects;
            if(objs.length != 0) {
                let e = objs[0];
                    let index = e.languages.findIndex((e) => e.code == language);
                    if(index != -1) {
                        console.log('language found!');
                        chrome.tabs.executeScript(tabId, {
                            code: `function sleep (delay) {
                                var start = new Date().getTime();
                                while (new Date().getTime() < start + delay);
                            }
                            if(document.getElementById("custom-subtitle")) {
                                document.getElementsByClassName("video-stream")[0].src = "";
                                window.location.reload();
                            }
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", "https://amara.org/api/videos/${e.id}/languages/ko/subtitles/?format=vtt");
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
                    }else{
                        console.log('language not found!');
                        chrome.tabs.executeScript(tabId, {
                            code: `if(document.getElementById("custom-subtitle")) {
                                let subtitle = document.getElementById("custom-subtitle");
                                window.URL.revokeObjectURL(subtitle.src);
                                subtitle.remove();
                                document.getElementsByClassName("video-stream")[0].src = "";
                                window.location.reload();
                            }`
                        })
                    }
            }else{
                console.log('not have in search result');
                chrome.tabs.executeScript(tabId, {
                    code: `if(document.getElementById("custom-subtitle")) {
                        let subtitle = document.getElementById("custom-subtitle");
                        window.URL.revokeObjectURL(subtitle.src);
                        subtitle.remove();
                        document.getElementsByClassName("video-stream")[0].src = "";
                        window.location.reload();
                    }`
                });
            }
        };
        xml.send();
    });
});