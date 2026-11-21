// ==UserScript==
// @name         YouTube Hidden Tag Viewer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Display hidden tags above Video's title
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.youtube.com/*
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  "use strict";

  const tagsId = "hidden-tag-viewer";

  const update = () => {
    const videoId = new URLSearchParams(location.search).get("v");
    const shown = document.getElementById(tagsId);
    if (shown && shown.dataset.videoId === videoId) {
      return;
    }
    // The og:video:tag meta tags keep the first video's tags after in-page
    // navigation, so read the tags from the player instead
    const details = document
      .getElementById("movie_player")
      ?.getPlayerResponse?.()?.videoDetails;
    const title = document.querySelector("ytd-watch-metadata #title");
    // The player switches to the new video a little after the URL changes
    if (!videoId || details?.videoId !== videoId || !title) {
      shown?.remove();
      return;
    }
    const tags = shown || document.createElement("p");
    tags.id = tagsId;
    tags.dataset.videoId = videoId;
    tags.textContent = `tags: [${(details.keywords || []).join(", ")}]`;
    tags.style.cssText =
      "margin: 0 0 4px; font-size: 1.4rem; color: var(--yt-spec-text-secondary);";
    title.prepend(tags);
  };

  setInterval(update, 1000);
})();
