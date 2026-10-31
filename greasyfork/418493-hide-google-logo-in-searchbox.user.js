// ==UserScript==
// @name         Hide Google logo in searchbox
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Hide
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.google.com/search*
// @grant        none
// @license      MIT
// ==/UserScript==

const style = document.createElement("style");
style.textContent =
  'form[role="search"] div:not(.logo) > a[href*="/webhp"] { display: none !important; }';
document.head.append(style);
