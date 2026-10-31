// ==UserScript==
// @name         Futaba Ad Remover
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Remove Futabachannel ads
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        *://*.2chan.net/*
// @match        *://*.2chan.net/*/*
// @match        *://*.2chan.net/*/*/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  function addStyleHide(cssSelector) {
    var D = document;
    var newNode = D.createElement("style");
    newNode.textContent = cssSelector + "{display:none !important;}";
    var targ = D.getElementsByTagName("head")[0] || D.body || D.documentElement;
    targ.appendChild(newNode);
  }
  const hideSelectors = [
    "#ad-wrapper",
    "#ad-wrapper-overlay",
    "#radtop",
    "#rightad",
    "#rightadfloat",
    "#hdp + hr",
    "div.tue",
    "div.tue2",
    'iframe[src*="dec.2chan.net"]',
  ];

  for (var i = 0; i < hideSelectors.length; i++) {
    addStyleHide(hideSelectors[i]);
  }
})();
