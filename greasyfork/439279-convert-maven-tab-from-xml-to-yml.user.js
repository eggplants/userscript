// ==UserScript==
// @name         Convert maven tab from xml to yml
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Convert maven tab from xml to yml on mvnrepository
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        *://mvnrepository.com/artifact/*/*/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*jshint esversion: 6 */

(function () {
  "use strict";
  "use moz";
  const findComments = (el) => {
    let arr = [];
    for (let i = 0; i < el.childNodes.length; i++) {
      let node = el.childNodes[i];
      if (node.nodeType === 8) {
        arr.push(node);
      } else {
        arr.push.apply(arr, findComments(node));
      }
    }
    return arr;
  };

  const mvn = document.querySelector("textarea#maven-a");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(mvn.value, "text/xml");
  const comments = findComments(xmlDoc);
  const dep = xmlDoc.querySelector("dependency");
  if (dep !== null) {
    mvn.value = `# ${
      comments.length > 0 ? comments[0].textContent.trim() + "\n" : ""
    }`;
    mvn.value +=
      "- {" +
      Array.from(dep.children)
        .map((e) => `${e.tagName}: ${e.textContent}`)
        .join(", ") +
      "}";
  }
})();
