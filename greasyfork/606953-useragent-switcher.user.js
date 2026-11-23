// ==UserScript==
// @name            User-Agent Switcher
// @namespace       http://tampermonkey.net/
// @version         1.0
// @description     Spoof navigator.userAgent, navigator.userAgentData and related properties on every site or per site
// @author          eggplants
// @homepage        https://github.com/eggplants
// @match           *://*/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           unsafeWindow
// @run-at          document-start
// @sandbox         raw
// @inject-into     page
// @license         MPL-2.0
// ==/UserScript==

// Based on: https://github.com/ray-lothian/UserAgent-Switcher (MPL-2.0)
//
// A userscript cannot rewrite request headers, so servers still receive the
// real User-Agent and Sec-CH-UA* headers. Only what page scripts read through
// navigator is spoofed, and workers keep the real WorkerNavigator

(function () {
  "use strict";

  // The overrides must land on the page's own objects, not on the userscript
  // manager's sandbox
  const page = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  const LOG_PREFIX = "[User-Agent Switcher]";
  const DELETE = Symbol("delete");

  const DEFAULTS = {
    // blacklist: spoof everywhere except the listed hosts
    // whitelist: spoof only on the listed hosts
    // custom: resolve the user agent from the JSON rules in `custom`
    mode: "blacklist",
    ua: "",
    blacklist: [],
    whitelist: [],
    custom: {},
    // URL substrings that always keep the real user agent
    protected: [
      "google.com/recaptcha",
      "gstatic.com/recaptcha",
      "accounts.google.com",
      "accounts.youtube.com",
      "gitlab.com/users/sign_in",
    ],
    userAgentData: true,
  };

  const PRESETS = [
    [
      "Chrome 158 / Windows",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36",
    ],
    [
      "Chrome 158 / macOS",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36",
    ],
    [
      "Chrome 158 / Linux",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36",
    ],
    [
      "Chrome 158 / Android",
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Mobile Safari/537.36",
    ],
    [
      "Edge 158 / Windows",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36 Edg/158.0.0.0",
    ],
    [
      "Firefox 158 / Windows",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0",
    ],
    [
      "Firefox 158 / macOS",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:158.0) Gecko/20100101 Firefox/158.0",
    ],
    [
      "Firefox 158 / Linux",
      "Mozilla/5.0 (X11; Linux x86_64; rv:158.0) Gecko/20100101 Firefox/158.0",
    ],
    [
      "Safari 26 / macOS",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
    ],
    [
      "Safari 26 / iPhone",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
    ],
  ];

  // --------------------------------------------------------------------------
  // Preferences
  // --------------------------------------------------------------------------

  const loadPrefs = () => {
    const prefs = { ...DEFAULTS, ...GM_getValue("prefs", {}) };
    for (const key of ["blacklist", "whitelist", "protected"]) {
      if (!Array.isArray(prefs[key])) prefs[key] = [];
    }
    if (prefs.custom === null || typeof prefs.custom !== "object") {
      prefs.custom = {};
    }
    return prefs;
  };

  const savePrefs = (prefs) => {
    GM_setValue("prefs", prefs);
    // Random picks belong to the rules they were drawn from
    GM_setValue("picks", {});
  };

  const normalizeHost = (value) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^\*\./, "")
      .split("/")[0]
      .split(":")[0]
      .replace(/\.$/, "");

  const hostMatchesEntry = (host, entry) => {
    const h = normalizeHost(entry);
    return h !== "" && (host === h || host.endsWith(`.${h}`));
  };

  const hostMatches = (host, list) =>
    list.some((entry) => hostMatchesEntry(host, entry));

  const isProtected = (prefs, href) =>
    prefs.protected.some(
      (entry) =>
        typeof entry === "string" && entry !== "" && href.includes(entry),
    );

  // A rule with several user agents picks one and keeps it until the settings
  // are saved, so that reloads and frames of the same site agree
  const pick = (ruleKey, value) => {
    if (!Array.isArray(value)) return typeof value === "string" ? value : "";
    if (value.length === 0) return "";
    const picks = GM_getValue("picks", {});
    if (!value.includes(picks[ruleKey])) {
      picks[ruleKey] = value[Math.floor(Math.random() * value.length)];
      GM_setValue("picks", picks);
    }
    return picks[ruleKey];
  };

  const resolveUserAgent = (prefs, loc) => {
    const host = loc.hostname;
    if (!host || isProtected(prefs, loc.href)) return "";
    if (prefs.mode === "whitelist") {
      return hostMatches(host, prefs.whitelist) ? prefs.ua : "";
    }
    if (prefs.mode === "custom") {
      for (const [hosts, value] of Object.entries(prefs.custom)) {
        if (hosts === "*" || hosts === "_") continue;
        if (hostMatches(host, hosts.split(/\s*,\s*/))) {
          return pick(hosts, value);
        }
      }
      return pick("*", prefs.custom["*"]) || prefs.ua;
    }
    return hostMatches(host, prefs.blacklist) ? "" : prefs.ua;
  };

  // --------------------------------------------------------------------------
  // User agent parsing
  // --------------------------------------------------------------------------

  const versionOf = (ua, token) =>
    ua.match(new RegExp(`${token}\\/(\\d+(?:\\.\\d+)*)`))?.[1] ?? "";

  const parseBrowser = (ua) => {
    const rules = [
      ["Edge", "Edg(?:e|A|iOS)?"],
      ["Opera", "OPR"],
      ["Samsung Internet", "SamsungBrowser"],
      ["Firefox", "(?:Firefox|FxiOS)"],
      ["Chrome", "(?:Chrome|CriOS)"],
      ["Safari", "Version"],
    ];
    for (const [name, token] of rules) {
      const version = versionOf(ua, token);
      if (version === "") continue;
      const mobileChrome = name === "Chrome" && /Android/.test(ua);
      return {
        name: mobileChrome ? "Mobile Chrome" : name,
        version,
        major: version.split(".")[0],
      };
    }
    return { name: "", version: "", major: "" };
  };

  const parseOS = (ua) => {
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/CrOS/.test(ua)) return "Chrome OS";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
    if (/Linux|X11/.test(ua)) return "Linux";
    return "";
  };

  const parseUserAgent = (ua) => {
    // FxiOS runs on WebKit, so it counts as Safari here
    const gecko = /Gecko\/\d/.test(ua) && /Firefox\//.test(ua);
    return {
      ua,
      browser: parseBrowser(ua),
      os: parseOS(ua),
      mobile:
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          ua,
        ),
      gecko,
      chromium: !gecko && /Chrome\/\d+/.test(ua),
      arm: /aarch64|\barm/i.test(ua),
    };
  };

  const linuxPlatformOf = (p) => {
    if (/aarch64/.test(p.ua)) return "Linux aarch64";
    if (p.os === "Android") return "Linux armv8l";
    if (/i[3-6]86/.test(p.ua) && !/x86_64/.test(p.ua)) return "Linux i686";
    return "Linux x86_64";
  };

  const platformOf = (p) => {
    switch (p.os) {
      case "Windows":
        return "Win32";
      case "macOS":
        return "MacIntel";
      case "iOS":
        return p.ua.match(/iPhone|iPad|iPod/)[0];
      case "":
        return "";
      default:
        // Chrome on Android reports "armv81", not "armv8l"
        return p.os === "Android" && !p.gecko
          ? "Linux armv81"
          : linuxPlatformOf(p);
    }
  };

  // Firefox reports the platform part of its UA, e.g. "Windows NT 10.0; Win64;
  // x64" or "Intel Mac OS X 10.15"
  const oscpuOf = (p) => {
    if (p.os !== "Windows" && p.os !== "macOS") return linuxPlatformOf(p);
    return (p.ua.match(/\(([^)]*)\)/)?.[1] ?? "")
      .split(/;\s*/)
      .filter((token) => token && !/^(?:rv:|Macintosh$|U$)/.test(token))
      .join("; ");
  };

  const appVersionOf = (p) => {
    const rest = p.ua.replace(/^Mozilla\//, "").replace(/^Opera\//, "");
    if (!p.gecko) return rest;
    // Firefox only keeps the first platform token: "5.0 (Windows)"
    return `5.0 ${rest.replace("5.0 ", "").split(/[\s;]/)[0]})`;
  };

  // Values for Navigator.prototype; DELETE removes a property that the
  // spoofed browser does not have
  const navigatorPropsOf = (p) => {
    const safari = !p.gecko && !p.chromium;
    return {
      userAgent: p.ua,
      appVersion: appVersionOf(p),
      platform: platformOf(p),
      vendor: p.gecko ? "" : safari ? "Apple Computer, Inc." : "Google Inc.",
      product: "Gecko",
      productSub: p.gecko ? "20100101" : "20030107",
      oscpu: p.gecko ? oscpuOf(p) : DELETE,
      buildID: p.gecko ? "20181001000000" : DELETE,
    };
  };

  // --------------------------------------------------------------------------
  // User-Agent Client Hints, ported from v3/data/inject/override.js
  // --------------------------------------------------------------------------

  // Chromium derives the GREASE brand and the brand order from the major
  // version (components/embedder_support/user_agent_utils.cc)
  const GREASEY_CHARS = [" ", "(", ":", "-", ".", "/", ")", ";", "=", "?", "_"];
  const GREASED_VERSIONS = ["8", "99", "24"];
  const BRAND_ORDERS = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];

  const greaseBrand = (seed) => {
    const c1 = GREASEY_CHARS[seed % GREASEY_CHARS.length];
    const c2 = GREASEY_CHARS[(seed + 1) % GREASEY_CHARS.length];
    return {
      brand: `Not${c1}A${c2}Brand`,
      version: GREASED_VERSIONS[seed % GREASED_VERSIONS.length],
    };
  };

  // Android Chrome reports the regular "Google Chrome" brand
  const brandNameOf = (name) =>
    ({
      Chrome: "Google Chrome",
      "Mobile Chrome": "Google Chrome",
      Edge: "Microsoft Edge",
    })[name] ?? name;

  const shuffle = (list, order) => {
    const shuffled = [];
    order.forEach((pos, i) => {
      shuffled[pos] = list[i];
    });
    return shuffled;
  };

  // `full` builds fullVersionList instead of brands
  const brandListOf = (p, full) => {
    const { name, major, version } = p.browser;
    const seed = Number(major) || 0;
    const grease = greaseBrand(seed);
    // The Chromium entry follows the Chrome/ token, not the browser's own
    // version: Opera reports "Opera";v="105", "Chromium";v="119"
    const chromeFull = versionOf(p.ua, "Chrome") || `${major}.0.0.0`;
    const list = [
      {
        brand: grease.brand,
        version: full ? `${grease.version}.0.0.0` : grease.version,
      },
      {
        brand: "Chromium",
        version: full ? chromeFull : chromeFull.split(".")[0],
      },
      { brand: brandNameOf(name), version: full ? version : major },
    ];
    // Edge and Opera put their own brand first; plain Chromium reports two
    if (name === "Edge" || name === "Opera") return [list[2], list[1], list[0]];
    if (name === "Chromium") {
      return shuffle([list[0], list[1]], [seed % 2, (seed + 1) % 2]);
    }
    return shuffle(list, BRAND_ORDERS[seed % BRAND_ORDERS.length]);
  };

  // https://wicg.github.io/ua-client-hints/#get-the-platform-version
  const platformVersionOf = (p) => {
    if (p.os === "Windows") {
      // Windows 11 also reports "Windows NT 10.0"
      const nt = p.ua.match(/Windows NT ([\d.]+)/)?.[1];
      return { 6.1: "0.1.0", 6.2: "0.2.0", 6.3: "0.3.0" }[nt] ?? "13.0.0";
    }
    const patterns = {
      macOS: [/Mac OS X ([\d_.]+)/, "10.15.7"],
      Android: [/Android (\d+(?:\.\d+)*)/, "10.0.0"],
      iOS: [/OS (\d+(?:[._]\d+)*) like Mac OS X/, "10.0.0"],
    };
    if (!patterns[p.os]) return "";
    const [pattern, fallback] = patterns[p.os];
    const parts = (p.ua.match(pattern)?.[1] ?? fallback)
      .replace(/_/g, ".")
      .split(".")
      .map((s) => (/^\d+$/.test(s) ? s : "0"));
    while (parts.length < 3) parts.push("0");
    return parts.slice(0, 3).join(".");
  };

  // "Android 10; K" -> "K", "...; SM-G960F Build/..." -> "SM-G960F"
  const modelOf = (p) => {
    if (!p.mobile) return "";
    const model = p.ua.match(/Android[^;)]*; ?([^;)]+)/)?.[1] ?? "";
    return model.split(/\s+Build\b/)[0].trim();
  };

  const CHROMIUM_BROWSERS = new Set([
    "Chrome",
    "Mobile Chrome",
    "Edge",
    "Opera",
    "Chromium",
  ]);

  // Only Chromium-based browsers have navigator.userAgentData
  const uaDataOf = (p) => {
    if (!p.chromium || !CHROMIUM_BROWSERS.has(p.browser.name)) {
      return null;
    }
    return {
      architecture: p.mobile ? "" : p.arm ? "arm" : "x86",
      bitness: p.mobile ? "" : /wow64/i.test(p.ua) ? "32" : "64",
      brands: brandListOf(p, false),
      formFactors: [p.mobile ? "Mobile" : "Desktop"],
      fullVersionList: brandListOf(p, true),
      mobile: p.mobile,
      model: modelOf(p),
      platform: p.os || "Unknown",
      platformVersion: platformVersionOf(p),
      uaFullVersion: p.browser.version,
      wow64: false,
    };
  };

  // --------------------------------------------------------------------------
  // Overriding a window
  // --------------------------------------------------------------------------

  // Every replaced function reports native source from toString(), and so
  // does the patched toString itself
  const nativeSources = new WeakMap();

  // Engines print native code differently (Firefox spreads it over three
  // lines and drops "get " from accessors), so copy this engine's own output
  const sourceTemplate = (fn, name) => {
    const source = page.Function.prototype.toString.call(fn);
    return (key) => source.replace(name, key);
  };
  const getterSource = sourceTemplate(
    Object.getOwnPropertyDescriptor(page.Navigator.prototype, "userAgent").get,
    "userAgent",
  );
  const methodSource = sourceTemplate(page.parseInt, "parseInt");

  const patchToString = (win) => {
    const proto = win.Function.prototype;
    const patched = new Proxy(proto.toString, {
      apply: (target, thisArg, args) =>
        nativeSources.has(thisArg)
          ? nativeSources.get(thisArg)
          : Reflect.apply(target, thisArg, args),
    });
    nativeSources.set(patched, methodSource("toString"));
    Object.defineProperty(proto, "toString", {
      ...Object.getOwnPropertyDescriptor(proto, "toString"),
      value: patched,
    });
  };

  // Method syntax yields functions without `prototype`, like native accessors
  const makeGetter = (key, original, get) => {
    const getter = Object.getOwnPropertyDescriptor(
      {
        get [key]() {
          // Calling the native getter keeps its "Illegal invocation" error on
          // foreign receivers
          return get(this, original?.call(this));
        },
      },
      key,
    ).get;
    nativeSources.set(getter, getterSource(key));
    return getter;
  };

  const defineGetter = (target, key, get) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      get: makeGetter(key, descriptor?.get, get),
      set: descriptor?.set,
    });
  };

  const defineMethod = (target, key, method) => {
    nativeSources.set(method, methodSource(key));
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: method,
    });
  };

  const LOW_ENTROPY_KEYS = ["brands", "mobile", "platform"];

  const spoofUAData = (win, navProto, data) => {
    // Plain objects of the target realm, so that a frame's instanceof checks
    // see its own Array and Object
    const values = win.JSON.parse(JSON.stringify(data));
    // Chromium hands out one frozen brands array
    Object.freeze(values.brands);

    const methods = {
      getHighEntropyValues(hints) {
        // Chromium rejects (does not throw) on a non-iterable argument
        if (
          hints === null ||
          typeof hints !== "object" ||
          typeof hints[Symbol.iterator] !== "function"
        ) {
          return win.Promise.reject(
            new win.TypeError(
              "Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': The provided value cannot be converted to a sequence.",
            ),
          );
        }
        const requested = new Set(hints);
        // Keys of `values` are in alphabetical order, like UADataValues
        const result = new win.Object();
        for (const [key, value] of Object.entries(values)) {
          if (LOW_ENTROPY_KEYS.includes(key) || requested.has(key)) {
            result[key] = value;
          }
        }
        return win.Promise.resolve(result);
      },
      toJSON() {
        const json = new win.Object();
        for (const key of LOW_ENTROPY_KEYS) json[key] = values[key];
        return json;
      },
    };

    const native = win.NavigatorUAData?.prototype;
    const useNative =
      native !== undefined &&
      Object.getOwnPropertyDescriptor(navProto, "userAgentData") !== undefined;
    // Chromium: patch the real NavigatorUAData so instanceof and the class
    // stay native. Other engines: build a stand-in prototype
    const proto = useNative ? native : new win.Object();
    for (const key of LOW_ENTROPY_KEYS) {
      defineGetter(proto, key, () => values[key]);
    }
    for (const [key, method] of Object.entries(methods)) {
      defineMethod(proto, key, method);
    }
    if (useNative) return;

    Object.defineProperty(proto, Symbol.toStringTag, {
      configurable: true,
      value: "NavigatorUAData",
    });
    const fake = win.Object.create(proto);
    defineGetter(navProto, "userAgentData", () => fake);
  };

  const patchedWindows = new WeakSet();

  const spoofWindow = (win, profile) => {
    if (patchedWindows.has(win)) return;
    patchedWindows.add(win);
    patchToString(win);
    const proto = Object.getPrototypeOf(win.navigator);
    for (const [key, value] of Object.entries(profile.props)) {
      if (value === DELETE) {
        delete proto[key];
      } else {
        defineGetter(proto, key, () => value);
      }
    }
    if (profile.uaData === null) {
      // Firefox and Safari have no userAgentData
      delete proto.userAgentData;
    } else if (win.isSecureContext) {
      // Chromium exposes userAgentData only in secure contexts
      spoofUAData(win, proto, profile.uaData);
    }
    hookFrames(win, profile);
  };

  // Same-origin frames (about:blank in particular) are not always reached by
  // the userscript manager, so patch them when the parent first touches them
  const hookFrames = (win, profile) => {
    const spoofChild = (child) => {
      if (!child) return;
      try {
        spoofWindow(child, profile);
      } catch {
        // Cross-origin frames run their own instance of this script
      }
    };
    for (const name of ["HTMLIFrameElement", "HTMLFrameElement"]) {
      const proto = win[name]?.prototype;
      if (!proto) continue;
      defineGetter(proto, "contentWindow", (_, child) => {
        spoofChild(child);
        return child;
      });
      defineGetter(proto, "contentDocument", (_, doc) => {
        spoofChild(doc?.defaultView);
        return doc;
      });
    }
  };

  // --------------------------------------------------------------------------
  // Settings dialog
  // --------------------------------------------------------------------------

  const STYLE = `
    :host { all: initial; }
    dialog {
      width: min(640px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      box-sizing: border-box;
      padding: 20px;
      border: 1px solid #8884;
      border-radius: 8px;
      color: #1f1f1f;
      background: #fff;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: light;
    }
    dialog::backdrop { background: #0006; }
    h1 { margin: 0 0 4px; font-size: 16px; }
    p { margin: 0 0 12px; color: #555; overflow-wrap: anywhere; }
    label { display: block; margin: 12px 0 4px; font-weight: 600; }
    label.inline { display: flex; gap: 6px; align-items: center; font-weight: 400; }
    select, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 6px;
      border: 1px solid #8888;
      border-radius: 4px;
      color: inherit;
      background: inherit;
      font: 12px/1.4 ui-monospace, monospace;
    }
    select + textarea { margin-top: 4px; }
    small { display: block; margin-top: 2px; color: #666; }
    .buttons { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    button {
      padding: 6px 14px;
      border: 1px solid #8888;
      border-radius: 4px;
      color: inherit;
      background: #f2f2f2;
      font: inherit;
      cursor: pointer;
    }
    button.primary { border-color: #1a73e8; color: #fff; background: #1a73e8; }
    p.error { margin: 12px 0 0; color: #c5221f; }
    [hidden] { display: none !important; }
    @media (prefers-color-scheme: dark) {
      dialog { color: #e8e8e8; background: #202124; color-scheme: dark; }
      p, small { color: #aaa; }
      button { background: #303134; }
      p.error { color: #f28b82; }
    }
  `;

  // Built without innerHTML so that pages enforcing Trusted Types accept it
  const h = (tag, props = {}, ...children) => {
    const element = document.createElement(tag);
    Object.assign(element, props);
    element.append(...children);
    return element;
  };

  // Constructed stylesheets are not subject to the page's style-src CSP
  const applyStyle = (root) => {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(STYLE);
      root.adoptedStyleSheets = [sheet];
    } catch {
      root.append(h("style", {}, STYLE));
    }
  };

  const lines = (list) => list.join("\n");
  const unlines = (text) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const textarea = (rows, value, props = {}) =>
    h("textarea", { rows, value, spellcheck: false, ...props });

  const openSettings = (status) => {
    const prefs = loadPrefs();
    const host = h("div");
    const root = host.attachShadow({ mode: "closed" });
    applyStyle(root);

    const mode = h(
      "select",
      {},
      h("option", { value: "blacklist" }, "Every site except excluded sites"),
      h("option", { value: "whitelist" }, "Included sites only"),
      h("option", { value: "custom" }, "Custom rules (JSON)"),
    );
    mode.value = prefs.mode;

    const preset = h(
      "select",
      {},
      h("option", { value: "" }, "Pick a preset…"),
      ...PRESETS.map(([label, ua]) => h("option", { value: ua }, label)),
    );
    const ua = textarea(3, prefs.ua);
    preset.addEventListener("change", () => {
      if (preset.value) ua.value = preset.value;
      preset.value = "";
    });

    const blacklist = textarea(4, lines(prefs.blacklist));
    const whitelist = textarea(4, lines(prefs.whitelist));
    const custom = textarea(8, JSON.stringify(prefs.custom, null, 2), {
      wrap: "off",
    });
    const protectedList = textarea(4, lines(prefs.protected));
    const uaData = h("input", {
      type: "checkbox",
      checked: prefs.userAgentData,
    });
    const error = h("p", { className: "error", hidden: true });

    const field = (label, input, note) =>
      h("div", {}, h("label", {}, label), input, h("small", {}, note));
    const hostNote = "One hostname per line. Subdomains are included.";
    const blacklistField = field("Excluded sites", blacklist, hostNote);
    const whitelistField = field("Included sites", whitelist, hostNote);
    const customField = field(
      "Custom rules",
      custom,
      'e.g. {"example.com, example.org": "UA", "*": ["UA1", "UA2"]}. ' +
        "An array picks one user agent at random and keeps it. " +
        '"*" matches every other site.',
    );
    const syncMode = () => {
      blacklistField.hidden = mode.value !== "blacklist";
      whitelistField.hidden = mode.value !== "whitelist";
      customField.hidden = mode.value !== "custom";
    };
    mode.addEventListener("change", syncMode);
    syncMode();

    const save = () => {
      let rules;
      try {
        rules = JSON.parse(custom.value.trim() || "{}");
        if (rules === null || typeof rules !== "object") {
          throw new TypeError("Custom rules must be a JSON object");
        }
      } catch (e) {
        error.textContent = String(e);
        error.hidden = false;
        mode.value = "custom";
        syncMode();
        return;
      }
      savePrefs({
        mode: mode.value,
        ua: ua.value.trim(),
        blacklist: unlines(blacklist.value),
        whitelist: unlines(whitelist.value),
        custom: rules,
        protected: unlines(protectedList.value),
        userAgentData: uaData.checked,
      });
      location.reload();
    };

    const cancelButton = h("button", { type: "button" }, "Cancel");
    const saveButton = h(
      "button",
      { type: "button", className: "primary" },
      "Save and reload",
    );
    const dialog = h(
      "dialog",
      {},
      h("h1", {}, "User-Agent Switcher"),
      h("p", {}, status),
      h("label", {}, "Spoof on"),
      mode,
      h("label", {}, "User agent"),
      preset,
      ua,
      h("small", {}, "Leave empty to keep the real user agent."),
      blacklistField,
      whitelistField,
      customField,
      field(
        "Protected URLs",
        protectedList,
        "One URL substring per line. These always keep the real user agent.",
      ),
      h(
        "label",
        { className: "inline" },
        uaData,
        "Spoof navigator.userAgentData for Chromium user agents",
      ),
      error,
      h("div", { className: "buttons" }, cancelButton, saveButton),
    );
    cancelButton.addEventListener("click", () => dialog.close());
    saveButton.addEventListener("click", save);
    dialog.addEventListener("close", () => host.remove());

    root.append(dialog);
    document.documentElement.append(host);
    dialog.showModal();
  };

  // Adds the current host to the active list, or removes every entry that
  // covers it
  const toggleSite = (prefs, key) => {
    const host = location.hostname;
    const kept = prefs[key].filter((entry) => !hostMatchesEntry(host, entry));
    prefs[key] = kept.length === prefs[key].length ? [...kept, host] : kept;
    savePrefs(prefs);
    location.reload();
  };

  // --------------------------------------------------------------------------
  // Entry point
  // --------------------------------------------------------------------------

  const prefs = loadPrefs();
  const ua = resolveUserAgent(prefs, location);

  if (ua) {
    const parsed = parseUserAgent(ua);
    try {
      spoofWindow(page, {
        props: navigatorPropsOf(parsed),
        uaData: prefs.userAgentData ? uaDataOf(parsed) : null,
      });
    } catch (e) {
      console.error(LOG_PREFIX, "failed to spoof", e);
    }
  }

  if (page.top === page) {
    const status = ua
      ? `This page is spoofed as: ${ua}`
      : "This page uses the real user agent.";
    GM_registerMenuCommand("Settings", () => openSettings(status));
    if (prefs.mode !== "custom") {
      const key = prefs.mode === "whitelist" ? "whitelist" : "blacklist";
      const listed = hostMatches(location.hostname, prefs[key]);
      const label = {
        blacklist: ["Exclude this site", "Stop excluding this site"],
        whitelist: ["Include this site", "Stop including this site"],
      }[key][Number(listed)];
      GM_registerMenuCommand(label, () => toggleSite(loadPrefs(), key));
    }
  }
})();
