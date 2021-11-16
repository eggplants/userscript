// ==UserScript==
// @name         YouTube Dislike  Concealer
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Hide the number of dislikes in YouTube
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.youtube.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

function addStyleHide(cssSelector){
    var D = document;
    var newNode = D.createElement('style');
    newNode.textContent = cssSelector + "{display:none !important;}";
    var targ = D.getElementsByTagName('head')[0] || D.body || D.documentElement;
    targ.appendChild (newNode);
};
addStyleHide("ytd-toggle-button-renderer:nth-of-type(2) > a > yt-formatted-string");
addStyleHide("ytd-sentiment-bar-renderer");