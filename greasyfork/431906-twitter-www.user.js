// ==UserScript==
// @name         Twitter www
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  www
// @author       eggplants
// @homepage     https://github.com/eggplants
// @include      https://twitter.com/*
// @exclude      https://twitter.com/compose/tweet
// @grant        none
// ==/UserScript==

setInterval(()=>{
    document.querySelectorAll('span').forEach(
        x=>{
            if (typeof(x.innerText)==="string"){
                x.innerText="ｗ".repeat(x.innerText.length)
               }
            }
        )
    }, 500
)