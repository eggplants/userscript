// ==UserScript==
// @name         GitHub Repo Share-to-Twitter Button
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Add a Twitter share button to repository page
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://github.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
  "use strict";

  const addButton = () => {
    const a = document.querySelector(
      'ul[class*="RepoHeaderActions-module"], ul.pagehead-actions',
    );
    if (a === null || a.querySelector(".share-to-twitter") !== null) {
      return;
    }
    const description = document.title;
    const pg_link = location.origin + location.pathname;

    const b = document.createElement("a");
    b.className = "btn btn-sm share-to-twitter";
    b.setAttribute("target", "_blank");
    b.href =
      "https://x.com/intent/post?" +
      new URLSearchParams({
        text: '"' + description + '"\n\n',
        url: pg_link,
      });
    b.textContent = "Share to Twitter";

    const c = document.createElement("li");
    c.append(b);

    a.prepend(c);
  };

  addButton();
  new MutationObserver(addButton).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
