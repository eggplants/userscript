// ==UserScript==
// @name         Insert zero-width spaces into your Tweet
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Insert zero-width characters in your tweets
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

/*jshint esversion: 8 */

function getText(editor) {
    return Array.from(editor.querySelectorAll('[data-block="true"]'))
        .map((block) => block.textContent)
        .join("\n");
}

// The editor is Draft.js, so the text must be replaced through a paste event
// for its internal state to follow the DOM.
function replaceText(editor, text) {
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    setTimeout(() => {
        const data = new DataTransfer();
        data.setData("text/plain", text);
        editor.dispatchEvent(
            new ClipboardEvent("paste", {
                clipboardData: data,
                bubbles: true,
                cancelable: true,
            })
        );
    }, 100);
}

function addButton(toolBar) {
    "use strict";
    let btn = document.createElement("button");
    btn.className = "zerow";
    btn.type = "button";
    btn.innerHTML = "Insert 0-width space";
    btn.onclick = function () {
        const selector = '[data-testid^="tweetTextarea_"][contenteditable="true"]';
        let parent = toolBar;
        while (parent !== null && parent.querySelector(selector) === null) {
            parent = parent.parentElement;
        }
        const editor = parent?.querySelector(selector);
        if (!editor) {
            console.log("editor is not found");
            return;
        }
        const text = getText(editor).replaceAll("\u{200B}", "");
        if (text.trim() === "") {
            console.log("do nothing");
            return;
        }
        replaceText(editor, text.replace(/[^\n]/g, "$&\u{200B}"));
        console.log("inserted!");
    };
    toolBar.firstElementChild.after(btn);
}

function waitForCompose() {
    document.querySelectorAll('[data-testid="toolBar"]').forEach((toolBar) => {
        if (toolBar.querySelector("button.zerow") === null) {
            addButton(toolBar);
        }
    });
}

var t = setInterval(waitForCompose, 500);
