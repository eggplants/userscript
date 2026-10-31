// ==UserScript==
// @name         Add All-Good Buttons into YouTube
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  [WIP][!!!NOT WORKING!!!]Add a button which push all good buttons of a video and comments at once
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.youtube.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

var D = document;

// create button
var btn = D.createElement('button');
btn.type = 'button';
btn.onclick = function() {
    D.getElementsByClassName(
        "style-scope ytd-toggle-button-renderer " +
        "style-text"
    )[0].click();
    a = D.getElementsByClassName(
        "style-scope ytd-toggle-button-renderer " +
        "style-default-active size-default"
    );
    for(var i = 0; a.length > i ; i++ ){ a[i].click() }
};
btn.appendChild(D.createTextNode('Push All'));

// add button
D.getElementsByClassName(
    "style-scope ytd-video-primary-info-renderer"
)[0].appendChild(btn);