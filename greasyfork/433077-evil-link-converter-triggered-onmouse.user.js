// ==UserScript==
// @name         Evil Link Converter triggered onmouse
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  I try to pretend evil Facebook's method.
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://x.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*jshint esversion: 6 */

(function () {
  "use strict";

  const target = "https://google.com";
  function main() {
    Array.from(document.getElementsByTagName("a")).forEach((elm) => {
      if (elm.dataset.evil !== undefined) {
        return;
      }
      elm.dataset.evil = "";
      elm.addEventListener("mousedown", () => doChange(elm));
      elm.addEventListener("mouseleave", () => undoChange(elm));
    });
  }
  function doChange(elm) {
    if (elm.dataset.evil === "") {
      elm.dataset.evil = elm.href;
      elm.href = target;
    }
  }
  function undoChange(elm) {
    if (elm.dataset.evil !== "") {
      elm.href = elm.dataset.evil;
      elm.dataset.evil = "";
    }
  }
  setInterval(main, 1000);
})();
