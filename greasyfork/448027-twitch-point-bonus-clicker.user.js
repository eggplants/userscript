// ==UserScript==
// @name         Twitch Point Bonus Clicker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Click Twitch Point Bonus button automatically
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://www.twitch.tv/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*jshint esversion: 11 */

(function () {
  "use strict";

  // The button's aria-label is translated and its class names are obfuscated,
  // but the icon inside it keeps a readable class name
  const claim = () => {
    document
      .querySelector(".claimable-bonus__icon")
      ?.closest("button")
      ?.click();
  };

  // A bonus shows up every 15 minutes, and checking every few seconds avoids
  // clicking again while the claim is still being sent
  setInterval(claim, 5000);
})();
