// ==UserScript==
// @name         Prime Video Auto Skip Intro
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Click "Skip Intro" and "Next Episode" buttons automatically on Prime Video in amazon.co.jp
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
  const introLabel = /イントロをスキップ|Skip Intro/;
  // The "next up" card shown over the ending credits
  const nextUpSelector =
    ".atvwebplayersdk-nextupcard-button, .atvwebplayersdk-nextupcard-wrapper button";
  // The button stays for a while after skipping
  const cooldown = 5000;
  let lastClicked = 0;

  // The player keeps hidden controls in the DOM, faded out with opacity
  const clickable = (e) =>
    !e.closest("[inert]") &&
    !e.disabled &&
    e.checkVisibility({ opacityProperty: true, visibilityProperty: true });

  const findIntroButton = () =>
    Array.from(document.querySelectorAll("button")).find(
      (e) =>
        introLabel.test(e.getAttribute("aria-label") || e.textContent) &&
        clickable(e),
    );

  const findNextUpButton = () =>
    Array.from(document.querySelectorAll(nextUpSelector)).find(clickable);

  const skip = () => {
    if (Date.now() - lastClicked < cooldown) {
      return;
    }
    const intro = findIntroButton();
    const button = intro || findNextUpButton();
    if (button) {
      button.click();
      lastClicked = Date.now();
      console.log(intro ? "intro skipped" : "moved to next episode");
    }
  };

  new MutationObserver(skip).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
