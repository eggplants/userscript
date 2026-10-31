// ==UserScript==
// @name         Twitter Rainbow Stream
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Make your Twetter Stream electrifying!
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

function rainbow() {
  const colors = "to right, red, orange, yellow, green, aqua, blue, purple";
  const style = document.createElement("style");
  style.textContent = `
        body {
            background: linear-gradient(${colors}) fixed !important;
        }
        #react-root div:not([role="button"]):not([data-testid="tweetPhoto"]),
        #react-root header,
        #react-root main,
        #react-root article,
        #react-root nav {
            background-color: transparent !important;
        }
    `;
  (document.head || document.documentElement).appendChild(style);
}
rainbow();
