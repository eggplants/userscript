// ==UserScript==
// @name         Hide Google logo in searchbox
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hide 
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.google.com/search*
// @grant        none
// @license      MIT
// ==/UserScript==

document.getElementsByClassName('x32v3e S003Ke ZoN4Lb')[0].remove()