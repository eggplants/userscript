// ==UserScript==
// @name         Prime Video Auto Skip Intro
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Click "Skip Intro" button automatically on Prime Video in amazon.co.jp
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://www.amazon.co.jp/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*jshint esversion: 6 */

(function () {
  "use strict";

  // The player's class names are obfuscated, so find the button by its label
  const label = /イントロをスキップ|Skip Intro/;
  // The button stays for a while after skipping
  const cooldown = 5000;
  let lastClicked = 0;

  const skip = () => {
    if (Date.now() - lastClicked < cooldown) {
      return;
    }
    const button = Array.from(document.querySelectorAll("button")).find(
      (e) =>
        label.test(e.getAttribute("aria-label") || e.textContent) &&
        e.offsetParent !== null,
    );
    if (button) {
      button.click();
      lastClicked = Date.now();
      console.log("intro skipped");
    }
  };

  new MutationObserver(skip).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
