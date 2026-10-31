// ==UserScript==
// @name         Thread info refine
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  tsumanne.
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://tsumanne.net/*/data/*/*/*/*/
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function x(sValue) {
    const aResult = new Array();
    const D = document;
    const a = D.evaluate(
      sValue,
      D,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (let i = 0; i < a.snapshotLength; i++) {
      aResult.push(a.snapshotItem(i));
    }
    return aResult;
  }

  for (const i of x(`//*[@class="rsc"]`)) {
    i.textContent += ":\t";
  }
  for (const i of x(`//*[@class="cnw"]`)) {
    i.textContent = i.textContent.replace(/\)/, ")\t");
    i.textContent += "\t";
  }
  for (const i of x(`//*[@class="cno"]`)) {
    i.textContent += "\t";
  }

  document
    .querySelectorAll(
      'object[data*="ad.html"], object[data="/bance.html"], object[data="/inoue.php"]',
    )
    .forEach((e) => e.remove());
})();
