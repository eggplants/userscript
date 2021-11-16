// ==UserScript==
// @name         GitHub Public Badge Remover
// @namespace    http://tampermonkey.net/
// @version      1.1
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
        console.log("tick");
        let cnt = 0;
        Array.from(
            document.querySelectorAll(
                `span.Label.Label--secondary.v-align-middle`
            )
        ).forEach((e) => {
            if (e.innerText === "Public") {
                e.style = "display: none !important";
                cnt++;
            }
        });
        if(cnt<1){
            timer.remove();
        }
    };
    const timer = setInterval(tick, 100);
})();