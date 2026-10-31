// ==UserScript==
// @name         Make Tsumanne links open in self window
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  tsumanne.
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://tsumanne.net/si/*
// @match        https://tsumanne.net/my/*
// @match        https://tsumanne.net/tj/*
// @match        https://tsumanne.net/sp/*
// @exclude      https://tsumanne.net/*/data/*/*/*/*/*
// @grant        none
// @license      MIT
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
  "use strict";
  Array.from(document.querySelectorAll("a[target=t]")).map(
    (n) => (n.target = "_self"),
  );
})();
