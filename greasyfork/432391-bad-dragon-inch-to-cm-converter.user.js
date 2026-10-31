// ==UserScript==
// @name         Bad Dragon Inch to CM Converter
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Convert unit from inch to centimeter in Bad Dragon
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://bad-dragon.com/products/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*jshint esversion: 6 */

(function() {
    "use strict";
    // the sizing chart is shown both inline and in a modal
    const convert = () => {
        document.querySelectorAll("table.sizing-chart tr").forEach((row) => {
            const head = row.querySelector("th");
            if (head === null || !head.textContent.includes("(inches)")) {
                return;
            }
            head.textContent = head.textContent.replace("(inches)", "(cm)");
            row.querySelectorAll("td").forEach((cell) => {
                const inch = Number(cell.textContent.trim());
                if (cell.textContent.trim() !== "" && !Number.isNaN(inch)) {
                    cell.textContent = (inch * 2.54).toFixed(2);
                }
            });
        });
    };
    convert();
    new MutationObserver(convert).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}());
