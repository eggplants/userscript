// ==UserScript==
// @name         Make All Contents Right to Left
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Make your browser Arabic one
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        *://*/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    document.body.setAttribute("style", "unicode-bidi: bidi-override;direction: rtl;text-align: left;");
})();