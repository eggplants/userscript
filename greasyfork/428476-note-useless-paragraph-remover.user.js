// ==UserScript==
// @name         Note useless paragraph Remover
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Remove blank paragraphs
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://note.com/*/n/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    "use strict";

    Array.prototype.filter.call(
        document.getElementsByTagName('p'),
        function(n) {
            return n.childNodes.length===1 && n.childNodes[0].tagName==="BR";
        }
    ).map(n=>n.remove());
}());