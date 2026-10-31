// ==UserScript==
// @name         GitHub Public Badge Remover
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Remove Public badge in GutHub
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.github.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
    "use strict";
    const tick = () => {
        document.querySelectorAll(
          `span.Label, span[class*="Label-Label"]`
        ).forEach((e) => {
          if (e.textContent.trim() === "Public") {
            e.style = "display: none !important";
          }
        });
    };
    tick();
    new MutationObserver(tick).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
})();
