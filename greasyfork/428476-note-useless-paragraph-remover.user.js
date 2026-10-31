// ==UserScript==
// @name         Note useless paragraph Remover
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Remove blank paragraphs
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://note.com/*/n/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    "use strict";

    // note is an SPA, so keep watching for newly rendered articles
    const hide = () => {
        Array.prototype.filter.call(
            document.getElementsByTagName('p'),
            function(n) {
                return n.childNodes.length===1 && n.childNodes[0].tagName==="BR";
            }
        ).forEach(n=>{ n.style.display = "none"; });
    };
    hide();
    new MutationObserver(hide).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}());
