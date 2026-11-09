// ==UserScript==
// @name            TVer Niconico Jikkyo Comments
// @name:ja         TVer ニコニコ実況コメント
// @namespace       http://tampermonkey.net/
// @version         1.0
// @description     Overlay archived Niconico Jikkyo comments on TVer episodes
// @description:ja  TVerの動画上にニコニコ実況の過去ログコメントを流します
// @author          eggplants
// @homepage        https://github.com/eggplants
// @match           https://tver.jp/*
// @require         https://cdn.jsdelivr.net/npm/@xpadev-net/niconicomments@0.4.1/dist/bundle.js#sha256=d62f58ae0bd045eb86c2e116eefaec34e46e9b53c2f710656efae9e79252fee7
// @grant           none
// @run-at          document-start
// @license         MIT
// ==/UserScript==

// Comments: https://jikkyo.tsukumijima.net/
// Rendering: https://github.com/xpadev-net/niconicomments
// Based on: https://github.com/nyankomaher/nicotver

(function () {
  "use strict";

  // TVer treats Chrome on Linux as an Android PC and only offers its app, so
  // pretend to be Windows before the page reads the user agent
  const spoofWindows = () => {
    const ua = navigator.userAgent;
    if (!/Linux/.test(ua) || /Android|CrOS/.test(ua)) return;
    const windowsUa = ua.replace(/\([^)]*\)/, "(Windows NT 10.0; Win64; x64)");
    const override = (name, value) =>
      Object.defineProperty(Navigator.prototype, name, {
        configurable: true,
        get: () => value,
      });
    override("userAgent", windowsUa);
    override("appVersion", windowsUa.replace(/^Mozilla\//, ""));
    override("platform", "Win32");
  };
  spoofWindows();

  const PREFIX = "tnc";
  const KAKOLOG_API = "https://jikkyo.tsukumijima.net/api/kakolog";
  const JST = 9 * 60 * 60 * 1000;
  // Share of airtime left after removing commercials, used to guess the
  // broadcast length from the video length
  const CONTENT_RATIO = 0.82;

  const CHANNELS = [
    [
      "地デジ",
      [
        ["jk1", "NHK総合"],
        ["jk2", "NHK Eテレ"],
        ["jk4", "日本テレビ"],
        ["jk5", "テレビ朝日"],
        ["jk6", "TBSテレビ"],
        ["jk7", "テレビ東京"],
        ["jk8", "フジテレビ"],
        ["jk9", "TOKYO MX"],
        ["jk10", "テレ玉"],
        ["jk11", "tvk"],
        ["jk12", "チバテレビ"],
      ],
    ],
    [
      "BS・CS",
      [
        ["jk101", "NHK BS"],
        ["jk103", "NHK BSプレミアム"],
        ["jk141", "BS日テレ"],
        ["jk151", "BS朝日"],
        ["jk161", "BS-TBS"],
        ["jk171", "BSテレ東"],
        ["jk181", "BSフジ"],
        ["jk191", "WOWOW PRIME"],
        ["jk192", "WOWOW LIVE"],
        ["jk193", "WOWOW CINEMA"],
        ["jk211", "BS11"],
        ["jk222", "BS12"],
        ["jk236", "BSアニマックス"],
        ["jk252", "WOWOW PLUS"],
        ["jk260", "BS松竹東急"],
        ["jk263", "BSJapanext"],
        ["jk265", "BSよしもと"],
        ["jk333", "AT-X"],
      ],
    ],
  ];

  const PROVIDER_IDS = {
    nhk: "jk1",
    ntv: "jk4",
    ex: "jk5",
    tbs: "jk6",
    tx: "jk7",
    cx: "jk8",
  };

  // TVer's broadcaster labels, including affiliates of the Kanto key stations
  const PROVIDER_LABELS = {
    jk1: "NHK総合",
    jk2: "NHK Eテレ",
    jk4: "日テレ 日本テレビ 読売テレビ 中京テレビ 札幌テレビ FBS福岡放送 RAB青森放送 テレビ岩手 福島中央テレビ 山梨放送 TeNY テレビ信州 福井放送 Daiichi-TV 日本海テレビ 広島テレビ 山口放送 四国放送 南海放送 高知放送 長崎国際テレビ KKTくまもと県民テレビ 鹿児島読売テレビ",
    jk5: "テレビ朝日 ABCテレビ KBCテレビ KFB福島放送 新潟テレビ21 静岡朝日テレビ 広島ホームテレビ 愛媛朝日テレビ KAB熊本朝日放送 メ～テレ",
    jk6: "TBS MBS毎日放送 CBCテレビ HBC北海道放送 RKB毎日放送 TUYテレビユー山形 TUFテレビユー福島 BSN SBC信越放送 チューリップテレビ MRO SBSテレビ BSS山陰放送 RSK山陽放送 RCCテレビ RKK熊本放送",
    jk7: "テレビ東京 テレ東 テレビ大阪 TVQ九州放送 テレビ北海道 テレビ愛知",
    jk8: "フジテレビ 関西テレビ 東海テレビ 北海道文化放送 テレビ西日本 仙台放送 秋田テレビ 福島テレビ 福井テレビ さんいん中央テレビ OHK岡山放送 テレビ新広島 テレビ愛媛 テレビ長崎 テレビ熊本 沖縄テレビ",
    jk9: "TOKYO MX",
    jk10: "テレ玉",
    jk11: "tvk",
    jk12: "チバテレ",
    jk141: "BS日テレ",
    jk151: "BS朝日",
    jk161: "BS-TBS",
    jk171: "BSテレ東",
    jk181: "BSフジ",
    jk211: "BS11",
    jk222: "BS12",
  };

  const toHalfWidth = (s) =>
    (s || "").replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0),
    );

  const CSS = `
    .${PREFIX}-canvas {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none;
    }
    .${PREFIX}-panel {
      margin: 12px 0; padding: 8px 12px; font-size: 13px; line-height: 1.6;
      border: 1px solid rgba(128, 128, 128, 0.35); border-radius: 8px;
    }
    .${PREFIX}-panel summary { cursor: pointer; font-weight: bold; }
    .${PREFIX}-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px;
      margin-top: 8px;
    }
    .${PREFIX}-row label { display: inline-flex; align-items: center; gap: 4px; }
    .${PREFIX}-panel input, .${PREFIX}-panel select, .${PREFIX}-panel button {
      font: inherit; color: inherit; background: transparent;
      border: 1px solid rgba(128, 128, 128, 0.5); border-radius: 4px;
      padding: 1px 6px;
    }
    .${PREFIX}-panel select option, .${PREFIX}-panel select optgroup {
      color: #000; background: #fff;
    }
    .${PREFIX}-panel button { cursor: pointer; }
    .${PREFIX}-panel button:hover { background: rgba(128, 128, 128, 0.15); }
    .${PREFIX}-panel input[name="offset"] { width: 6em; }
    .${PREFIX}-panel input[name="minutes"] { width: 5em; }
    .${PREFIX}-status { margin: 8px 0 0; opacity: 0.8; }
    .${PREFIX}-list {
      margin-top: 8px; max-height: 300px; overflow-y: auto;
      border: 1px solid rgba(128, 128, 128, 0.35); border-radius: 4px;
    }
    .${PREFIX}-list:empty { display: none; }
    .${PREFIX}-list div {
      display: flex; gap: 8px; padding: 0 6px; cursor: pointer;
      white-space: nowrap;
    }
    .${PREFIX}-list div:hover { background: rgba(128, 128, 128, 0.15); }
    .${PREFIX}-list div.${PREFIX}-current { background: rgba(128, 128, 128, 0.3); }
    .${PREFIX}-list time {
      flex: none; width: 4.5em; text-align: right;
      font-family: monospace; opacity: 0.7;
    }
    .${PREFIX}-list span { overflow: hidden; text-overflow: ellipsis; }
  `;

  const channelOptions = CHANNELS.map(
    ([group, items]) =>
      `<optgroup label="${group}">${items
        .map(([id, name]) => `<option value="${id}">${id}: ${name}</option>`)
        .join("")}</optgroup>`,
  ).join("");

  const PANEL_HTML = `
    <summary>ニコニコ実況コメント</summary>
    <div class="${PREFIX}-row">
      <label>チャンネル <select name="channel">${channelOptions}</select></label>
      <label>放送開始 <input name="date" type="date"><input name="time" type="time"></label>
      <label>取得 <input name="minutes" type="number" min="1" max="360" value="60">分</label>
      <button name="load" type="button">コメント取得</button>
    </div>
    <div class="${PREFIX}-row">
      <span>オフセット</span>
      <button type="button" data-delta="-15">-15</button>
      <button type="button" data-delta="-5">-5</button>
      <label><input name="offset" type="number" step="1" value="0">秒</label>
      <button type="button" data-delta="5">+5</button>
      <button type="button" data-delta="15">+15</button>
      <label><input name="visible" type="checkbox" checked>コメントを表示</label>
    </div>
    <div class="${PREFIX}-row">
      <button name="scroll" type="button">再生位置までスクロール</button>
      <button type="button" data-part="A">A</button>
      <button type="button" data-part="B">B</button>
      <button type="button" data-part="C">C</button>
    </div>
    <p class="${PREFIX}-status">放送局と放送開始日時を確認して「コメント取得」を押してください。</p>
    <div class="${PREFIX}-list"></div>
  `;

  /** @type {{ episodeId: string, panel: HTMLDetailsElement, canvas: HTMLCanvasElement | null, renderer: any, comments: {vpos: number, content: string}[], offset: number, frame: number, abort: AbortController } | null} */
  let state = null;

  const $ = (selector) => state.panel.querySelector(selector);

  const setStatus = (message) => {
    $(`.${PREFIX}-status`).textContent = message;
  };

  // The player is replaced when it switches from the preview to the full one
  const findVideo = () =>
    document.querySelector("video.vjs-tech") ||
    Array.from(document.querySelectorAll("video")).find(
      (v) => v.getBoundingClientRect().width > 0,
    );

  const pad = (n) => String(n).padStart(2, "0");

  const formatTime = (centiseconds) => {
    const total = Math.max(0, Math.floor(centiseconds / 100));
    return `${Math.floor(total / 60)}:${pad(total % 60)}`;
  };

  // "YYYY-MM-DD" and "HH:MM" in JST
  const toJstFields = (epochSeconds) => {
    const d = new Date(epochSeconds * 1000 + JST);
    return {
      date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    };
  };

  const fromJstFields = (date, time) =>
    Math.floor(
      new Date(`${date}T${time || "00:00"}:00+09:00`).getTime() / 1000,
    );

  const guessChannel = (providerId, providerLabel) => {
    if (PROVIDER_IDS[providerId]) return PROVIDER_IDS[providerId];
    const label = toHalfWidth(providerLabel);
    if (!label) return null;
    for (const [jk, names] of Object.entries(PROVIDER_LABELS)) {
      if (
        names.split(" ").some((name) => label.startsWith(toHalfWidth(name)))
      ) {
        return jk;
      }
    }
    return null;
  };

  // TVer doesn't expose the airtime, but an episode usually opens right after
  // the broadcast ends, so the start is estimated backwards from the length
  const guessSchedule = ({ openAt, duration, dateLabel }) => {
    const m = dateLabel?.match(/(\d+)月(\d+)日/);
    let labelDay = null;
    if (m) {
      const base = new Date((openAt ? openAt * 1000 : Date.now()) + JST);
      let year = base.getUTCFullYear();
      const candidate = (y) =>
        fromJstFields(`${y}-${pad(m[1])}-${pad(m[2])}`, "00:00");
      if (candidate(year) > base.getTime() / 1000 + 86400) year--;
      labelDay = candidate(year);
    }

    if (openAt && duration) {
      const airtime = duration / CONTENT_RATIO;
      const quarter = 15 * 60;
      const start = Math.round((openAt - airtime) / quarter) * quarter;
      // Late-night shows are labeled with the previous day
      const plausible =
        labelDay == null ||
        (start >= labelDay && start < labelDay + 30 * 60 * 60);
      if (plausible) {
        return {
          ...toJstFields(start),
          minutes: Math.ceil((openAt - start) / 60) + 5,
          estimated: true,
        };
      }
    }

    return {
      date: labelDay == null ? null : toJstFields(labelDay).date,
      time: null,
      minutes: duration ? Math.ceil(duration / CONTENT_RATIO / 60) + 5 : null,
      estimated: false,
    };
  };

  const fetchEpisodeMeta = async (episodeId, signal) => {
    const [statics, contents] = await Promise.all([
      fetch(`https://statics.tver.jp/content/episode/${episodeId}.json`, {
        signal,
      })
        .then((r) => r.json())
        .catch(() => ({})),
      fetch(
        `https://contents-api.tver.jp/contents/api/v2/episodes/${episodeId}`,
        {
          signal,
          headers: { "x-tver-platform-type": "web" },
        },
      )
        .then((r) => r.json())
        .then((j) => j.episode || {})
        .catch(() => ({})),
    ]);
    const openAt =
      statics.viewStatus?.startAt ??
      (contents.open_at ? Date.parse(contents.open_at) / 1000 : null);
    return {
      providerId: statics.broadcastProviderID || contents.broadcast_provider_id,
      providerLabel: statics.broadcastProviderLabel,
      dateLabel: statics.broadcastDateLabel || contents.broadcast_date_label,
      openAt,
      duration: contents.duration || findVideo()?.duration || null,
    };
  };

  const fillDefaults = async () => {
    const { episodeId, abort } = state;
    let meta;
    try {
      meta = await fetchEpisodeMeta(episodeId, abort.signal);
    } catch {
      return;
    }
    if (abort.signal.aborted) return;

    const channel = guessChannel(meta.providerId, meta.providerLabel);
    if (channel) $('[name="channel"]').value = channel;

    const schedule = guessSchedule(meta);
    if (schedule.date) $('[name="date"]').value = schedule.date;
    if (schedule.time) $('[name="time"]').value = schedule.time;
    if (schedule.minutes)
      $('[name="minutes"]').value = String(schedule.minutes);

    const source = `${meta.providerLabel || meta.providerId || "?"} / ${meta.dateLabel || "?"}`;
    setStatus(
      schedule.estimated
        ? `${source}: 放送開始を ${schedule.date} ${schedule.time} と推定しました。違っていたら直してから「コメント取得」を押してください。`
        : `${source}: 放送開始時刻を入力して「コメント取得」を押してください。`,
    );
  };

  const loadComments = async (channel, start, end, signal) => {
    const url = `${KAKOLOG_API}/${channel}?starttime=${start}&endtime=${end}&format=json`;
    const json = await fetch(url, { signal }).then((r) => r.json());
    if (json.error) throw new Error(json.error);

    const userIds = new Map();
    return (json.packet || [])
      .map(({ chat }) => chat)
      .filter((chat) => chat && chat.content && !Number(chat.deleted))
      .map((chat) => {
        if (!userIds.has(chat.user_id)) userIds.set(chat.user_id, userIds.size);
        const date = Number(chat.date);
        const usec = Number(chat.date_usec) || 0;
        return {
          id: Number(chat.no) || 0,
          // The archive's vpos counts from the start of the live thread, so
          // measure it from the broadcast start instead
          vpos: Math.floor((date + usec / 1e6 - start) * 100),
          content: chat.content,
          date,
          date_usec: usec,
          owner: false,
          premium: chat.premium === "1",
          mail: (chat.mail || "").split(/\s+/).filter(Boolean),
          user_id: userIds.get(chat.user_id),
          layer: -1,
          is_my_post: false,
        };
      })
      .filter((c) => c.vpos >= 0)
      .toSorted((a, b) => a.vpos - b.vpos);
  };

  const renderList = (comments) => {
    const list = $(`.${PREFIX}-list`);
    const fragment = document.createDocumentFragment();
    comments.forEach((comment, i) => {
      const row = document.createElement("div");
      row.dataset.index = String(i);
      row.title = comment.content;
      const time = document.createElement("time");
      time.textContent = formatTime(comment.vpos);
      const text = document.createElement("span");
      text.textContent = comment.content;
      row.append(time, text);
      fragment.append(row);
    });
    list.replaceChildren(fragment);
  };

  const setOffset = (value, updateInput = true) => {
    state.offset = Number.isFinite(value) ? value : 0;
    if (updateInput)
      $('[name="offset"]').value = String(Math.round(state.offset));
  };

  const currentVpos = () => {
    const video = findVideo();
    return video ? Math.floor((video.currentTime + state.offset) * 100) : 0;
  };

  const scrollToRow = (index) => {
    const list = $(`.${PREFIX}-list`);
    const row = list.children[index];
    if (!row) return;
    list
      .querySelector(`.${PREFIX}-current`)
      ?.classList.remove(`${PREFIX}-current`);
    row.classList.add(`${PREFIX}-current`);
    list.scrollTop = row.offsetTop - list.offsetTop - list.clientHeight / 2;
  };

  const scrollToPlayingPosition = () => {
    const vpos = currentVpos();
    const { comments } = state;
    let lo = 0;
    let hi = comments.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (comments[mid].vpos < vpos) lo = mid + 1;
      else hi = mid;
    }
    scrollToRow(Math.min(lo, comments.length - 1));
  };

  // Anime viewers post "A" / "B" / "C" when each part begins
  const scrollToPart = (part) => {
    let count = 0;
    const index = state.comments.findIndex(
      (c) =>
        toHalfWidth(c.content).trim().toUpperCase() === part && ++count >= 5,
    );
    if (index === -1) {
      setStatus(`${part}パートと思われる箇所が見つかりませんでした。`);
      return;
    }
    scrollToRow(index);
  };

  const attachCanvas = () => {
    const video = findVideo();
    if (!video || !state.canvas) return null;
    if (state.canvas.previousElementSibling !== video) {
      // Right after the video so the player's controls stay on top
      video.after(state.canvas);
    }
    return video;
  };

  const draw = () => {
    if (!state?.renderer) return;
    const video = attachCanvas();
    if (video) state.renderer.drawCanvas(currentVpos());
    state.frame = requestAnimationFrame(draw);
  };

  const stopRenderer = () => {
    if (!state) return;
    cancelAnimationFrame(state.frame);
    state.canvas?.remove();
    state.canvas = null;
    state.renderer = null;
    state.comments = [];
  };

  const onLoad = async () => {
    const channel = $('[name="channel"]').value;
    const date = $('[name="date"]').value;
    const time = $('[name="time"]').value;
    const minutes = Number($('[name="minutes"]').value);
    if (!date || !time || !(minutes > 0)) {
      setStatus("放送開始日時と取得時間を入力してください。");
      return;
    }

    stopRenderer();
    $(`.${PREFIX}-list`).replaceChildren();
    const start = fromJstFields(date, time);
    const { abort } = state;
    setStatus("コメントを取得しています…");

    let comments;
    try {
      comments = await loadComments(
        channel,
        start,
        start + minutes * 60,
        abort.signal,
      );
    } catch (e) {
      if (!abort.signal.aborted)
        setStatus(`コメントの取得に失敗しました（${e.message}）。`);
      return;
    }
    if (abort.signal.aborted) return;
    if (comments.length === 0) {
      setStatus("コメントが0件でした。チャンネルと日時を確認してください。");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.className = `${PREFIX}-canvas`;
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.hidden = !$('[name="visible"]').checked;
    state.canvas = canvas;
    state.comments = comments;
    try {
      state.renderer = new globalThis.NiconiComments(canvas, comments, {
        format: "formatted",
      });
    } catch (e) {
      stopRenderer();
      setStatus(`コメントの描画準備に失敗しました（${e.message}）。`);
      return;
    }
    renderList(comments);
    draw();
    setStatus(
      `${comments.length}件のコメントを読み込みました。ずれている場合はオフセットか一覧のコメントのクリックで合わせてください。`,
    );
  };

  const bindPanel = () => {
    const { panel } = state;
    panel.addEventListener("click", (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const button = target.closest("button");
      if (button?.name === "load") onLoad();
      else if (button?.name === "scroll") scrollToPlayingPosition();
      else if (button?.dataset.delta)
        setOffset(state.offset + Number(button.dataset.delta));
      else if (button?.dataset.part) scrollToPart(button.dataset.part);

      // Clicking a comment syncs it to the current frame
      const row = target.closest(`.${PREFIX}-list div`);
      const video = findVideo();
      if (row && video) {
        const comment = state.comments[Number(row.dataset.index)];
        setOffset(comment.vpos / 100 - video.currentTime);
        scrollToRow(Number(row.dataset.index));
      }
    });
    $('[name="offset"]').addEventListener("input", (e) => {
      setOffset(Number(e.target.value), false);
    });
    $('[name="visible"]').addEventListener("change", (e) => {
      if (state.canvas) state.canvas.hidden = !e.target.checked;
    });
  };

  const teardown = () => {
    if (!state) return;
    state.abort.abort();
    stopRenderer();
    state.panel.remove();
    state = null;
  };

  const episodeIdOf = (pathname) =>
    pathname.match(/^\/episodes\/([^/]+)/)?.[1] ?? null;

  const tick = () => {
    const episodeId = episodeIdOf(location.pathname);
    if (state && state.episodeId !== episodeId) teardown();
    if (!episodeId) return;

    const anchor = document.querySelector('[class*="Episode_player"]');
    if (!anchor) return;

    if (!state) {
      const panel = document.createElement("details");
      panel.className = `${PREFIX}-panel`;
      panel.open = true;
      panel.innerHTML = PANEL_HTML;
      state = {
        episodeId,
        panel,
        canvas: null,
        renderer: null,
        comments: [],
        offset: 0,
        frame: 0,
        abort: new AbortController(),
      };
      bindPanel();
      fillDefaults();
    }
    // React may re-render the page and drop the panel
    if (state.panel.previousElementSibling !== anchor)
      anchor.after(state.panel);
  };

  const start = () => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.append(style);

    // TVer is a SPA, so watch for page changes
    setInterval(tick, 500);
    tick();
  };

  // Runs at document-start for the user agent, before <head> exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
