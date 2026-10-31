// ==UserScript==
// @name         YouTube Ad Remover
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Skip and remove YouTube ads without click
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.youtube.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  function clickButton(selector) {
    let elm = document.querySelector(selector);
    if (elm) {
      elm.click();
    }
  }

  function addStyleHide(cssSelector) {
    var D = document;
    var newNode = D.createElement("style");
    newNode.textContent = cssSelector + "{display:none !important;}";
    var targ = D.getElementsByTagName("head")[0] || D.body || D.documentElement;
    targ.appendChild(newNode);
  }

  function tick() {
    clickButton(".ytp-skip-ad-button");
    clickButton(".ytp-ad-skip-button-modern");
    clickButton(".ytp-ad-skip-button");
  }

  // main

  const hideSelectors = [
    "#masthead-ad",
    "#player-ads",
    ".ytp-ad-image-overlay",
    ".ytp-ad-overlay-container",
    ".ytp-ad-message-container",
    ".ytp-ad-player-overlay-flyout-cta",
    ".ytp-paid-content-overlay",
    "ytd-ad-slot-renderer",
    "ytd-banner-promo-renderer",
    "ytd-companion-slot-renderer",
    "ytd-display-ad-renderer",
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    "ytd-in-feed-ad-layout-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-rich-item-renderer:has(ytd-ad-slot-renderer)",
    "ytd-video-masthead-ad-v3-renderer",
    "ytm-promoted-sparkles-web-renderer",
  ];

  for (var i = 0; i < hideSelectors.length; i++) {
    addStyleHide(hideSelectors[i]);
  }

  setInterval(tick, 100);
})();
