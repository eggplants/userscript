// ==UserScript==
// @name         Twitter Popup Notifier
// @namespace    http://gist.github.com/
// @version      0.3
// @description  Notify your arraival of DM and Alert with popup
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://x.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*jshint esversion: 6 */

(() => {
  "use strict";
  const notifyPermission = Notification.permission;
  if (notifyPermission === "denied") {
    return;
  } else {
    Notification.requestPermission().then(() => {
      console.log(1);
      setInterval(tick, 60000);
    });
  }
  const popup = (text, link) => {
    const notification = new Notification(text);
    notification.addEventListener("click", () => {
      window.open(link);
    });
  };
  // aria-live badges hold the unread count regardless of UI language
  const unread = (testid) => {
    const badge = document.querySelector(
      `[data-testid="${testid}"] [aria-live="polite"]`,
    );
    return badge === null ? 0 : parseInt(badge.textContent, 10) || 1;
  };
  let lastDM = 0;
  let lastAlert = 0;
  const tick = () => {
    // DM
    const DM = unread("AppTabBar_DirectMessage_Link");
    if (DM > lastDM) {
      console.log("DM");
      popup(`DM has arrived!: ${DM} unread items`, "https://x.com/i/chat");
    }
    lastDM = DM;
    // Alert
    const Alert = unread("AppTabBar_Notifications_Link");
    if (Alert > lastAlert) {
      console.log("Al");
      popup(
        `Notification has came!: ${Alert} unread items`,
        "https://x.com/notifications",
      );
    }
    lastAlert = Alert;
  };
})();
