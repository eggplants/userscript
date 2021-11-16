// ==UserScript==
// @name         This domain is available?
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Search now domain at instantdomainsearch.com from right-click menu
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        *://*/*
// @grant        GM_openInTab
// @run-at       context-menu
// @license      MIT
// ==/UserScript==

/*jshint esversion: 6 */

(function() {
    "use strict";
    GM_openInTab("https://instantdomainsearch.com/search/domains?q=" + window.location.host, false);
})();