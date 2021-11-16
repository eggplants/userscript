// ==UserScript==
// @name         Add Border to SDS tables
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  厚生労働省SDSの表に枠線を追加
// @author       eggplants
// @homepage     https://github.com/eggplants
// @match        https://anzeninfo.mhlw.go.jp/anzen/gmsds/*
// @grant        none
// ==/UserScript==

Array.from(document.querySelectorAll("table")).forEach(x=>x.setAttribute("border",""))

