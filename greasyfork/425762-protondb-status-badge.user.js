// ==UserScript==
// @name         ProtonDB Status Badge
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add a badge of ProtonDB Status to Steam store page with shields.io.
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        *://store.steampowered.com/app/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*jshint esversion: 6 */

(function () {
  "use strict";

  var D = document;

  const appid = location.pathname.split("/")[2];
  const badgeHref = "https://www.protondb.com/app/" + appid;
  const badgeSrc =
    "https://img.shields.io/badge/dynamic/json?" +
    new URLSearchParams({
      url: `https://www.protondb.com/api/v1/reports/summaries/${appid}.json`,
      query: "$.trendingTier",
      label: "ProtonDB",
      color: "e3e3e3",
      style: "plastic",
    });

  var protonElm = D.createElement("div");
  protonElm.innerHTML = `
<div class="user_reviews_summary_row">
    <div class="subtitle column">ProtonDB:</div>
    <div class="summary column">
        <a target="_blank">
            <img />
        </a>
    </div>
</div>`.trim();
  protonElm.querySelector("a").href = badgeHref;
  protonElm.querySelector("img").src = badgeSrc;

  D.querySelector("div.user_reviews").appendChild(protonElm.firstChild);
})();
