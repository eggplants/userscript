// ==UserScript==
// @name         Twitter www
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  www
// @author       eggplants
// @homepage     https://github.com/eggplants
// @include      https://x.com/*
// @grant        none
// ==/UserScript==

setInterval(()=>{
    if (location.pathname.startsWith("/compose/")) {
        return;
    }
    document.querySelectorAll('span').forEach(
        x=>{
            if (typeof(x.innerText)==="string" && !x.closest('[contenteditable="true"]')){
                x.innerText="ｗ".repeat(x.innerText.length)
               }
            }
        )
    }, 500
)
