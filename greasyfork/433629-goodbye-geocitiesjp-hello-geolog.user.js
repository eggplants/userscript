// ==UserScript==
// @name         Goodbye GeocitiesJP, Hello GeoLog
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Geocities JP to GeoLog(geolog.mydns.jp) Auto Redirector
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        *
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
  "use strict";
  document.querySelectorAll("a[href*='geocities.jp']").forEach((e) => {
    e.href = "https://geolog.mydns.jp/" + e.href.replace(/(^\w+:|^)\/\//, "");
  });
})();