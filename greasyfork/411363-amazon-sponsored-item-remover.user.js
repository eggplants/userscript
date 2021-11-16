// ==UserScript==
// @name         Amazon Sponsored Item Remover
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Remove Sponcored items from search result page on Amazon
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match         https://*.amazon.co.jp/*
// @match         https://*.amazon.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    "use strict";

    function addStyleHide(cssSelector){
        var D = document;
        var newNode = D.createElement('style');
        newNode.textContent = cssSelector + "{display:none !important;}";
        var targ = D.getElementsByTagName('head')[0] || D.body || D.documentElement;
        targ.appendChild (newNode);
    }

     addStyleHide("div.AdHolder");
}());