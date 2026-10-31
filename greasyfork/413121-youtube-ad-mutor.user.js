// ==UserScript==
// @name         YouTube Ad Mutor
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Mute YouTube ads
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://*.youtube.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  let inAd = false;
  let wasMuted = false;

  function getVideo() {
    return document.querySelector("#movie_player video");
  }
  function chkAd() {
    return document.querySelector(".html5-video-player.ad-showing") !== null;
  }
  function mutor() {
    const video = getVideo();
    if (video === null) {
      return;
    }
    if (chkAd() && !inAd) {
      wasMuted = video.muted;
      video.muted = true;
      inAd = true;
    } else if (!chkAd() && inAd) {
      video.muted = wasMuted;
      inAd = false;
    }
  }

  setInterval(mutor, 100);
})();
