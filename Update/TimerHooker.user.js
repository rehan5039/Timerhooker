// ==UserScript==
// @name            TimerHooker
// @name:en         TimerHooker
// @version         1.5.0
// @description     UI + compatibility overhaul. Adjust timers and media speed with a compact, accessible, theme-aware control. Best-effort, ethical behavior with graceful fallbacks.
// @description:en  Modern UI and robust timer/media speed controls with safe fallbacks.
// @require         https://raw.githubusercontent.com/rehan5039/Timerhooker/refs/heads/main/Everything-Hook.js?download
// @author          rehan
// @homepage        https://github.com/rehan5039/Timerhooker
// @supportURL      https://github.com/rehan5039/Timerhooker/issues
// @match           *://*/*
// @match           file:///*
// @run-at          document-start
// @grant           none
// @inject-into     page
// @license         GPL-3.0-or-later
// @namespace       https://rehan5039.github.io/
// ==/UserScript==
/**
 * Changelog
 * v1.5.0 (2025-11-01)
 * - Modern compact vertical UI (theme-aware, accessible, mobile-friendly)
 * - Configurable shortcuts; per-origin persistence with optional tab sync
 * - Safer hooks, Shadow DOM and iframe best-effort support
 * - CSP/sandbox detection and friendly fallbacks (no bypassing protections)
 * - Namespaced globals under window.__TimerHooker__
 */

/**
 * 1. hook Object.defineProperty | Object.defineProperties
 * 2. set configurable: true
 * 3. delete property
 * 4. can set property for onxx event method
 */

window.isDOMLoaded = false;
window.isDOMRendered = false;

document.addEventListener('readystatechange', function () {
    if (document.readyState === "interactive" || document.readyState === "complete") {
        window.isDOMLoaded = true;
    }
});

// Ensure the flag is correct even if this script runs after the page is already interactive/complete (e.g., YouTube SPA)
if (document.readyState === "interactive" || document.readyState === "complete") {
    window.isDOMLoaded = true;
}

// Namespace and settings
;(function initNamespace(){
    try {
        window.__TimerHooker__ = window.__TimerHooker__ || {};
        var ns = window.__TimerHooker__;
        ns.version = '1.5.0';
        ns._originKey = location.hostname;
        ns._settingsKey = '__th_settings__:' + ns._originKey;
        ns.defaults = {
            theme: 'system',           // 'light' | 'dark' | 'system'
            syncAcrossTabs: false,
            sendToIframes: true,
            pinned: true,
            excluded: false,
            hotkeys: {
                increase: 'Alt+Shift+ArrowUp',
                decrease: 'Alt+Shift+ArrowDown',
                multiply: 'Ctrl+Alt+=',
                divide: 'Ctrl+Alt+-',
                reset: 'Ctrl+Alt+0',
                prompt: 'Ctrl+Alt+9'
            }
        };
        ns.loadSettings = function(){
            try {
                var raw = localStorage.getItem(ns._settingsKey);
                if (!raw) return JSON.parse(JSON.stringify(ns.defaults));
                var parsed = JSON.parse(raw);
                return Object.assign({}, ns.defaults, parsed);
            } catch(e){
                return JSON.parse(JSON.stringify(ns.defaults));
            }
        };
        ns.saveSettings = function(settings){
            try { localStorage.setItem(ns._settingsKey, JSON.stringify(settings)); } catch(e) {}
        };
        ns.getPercentageKey = function(){ return '__th_percentage__:' + ns._originKey; };
    } catch(e) {
        // ignore
    }
})();

~function (global) {

    var workerURLs = [];
    var extraElements = [];
    var suppressEvents = {};

    var helper = function (eHookContext, timerContext, util) {
        return {
            applyUI: function () {
                var ns = window.__TimerHooker__ || {};
                var settings = (ns.loadSettings && ns.loadSettings()) || (ns.defaults || {});
                var rateStr = (1 / timerContext._percentage).toFixed(2);

                // Build style with theme awareness and accessibility (glassmorphism)
                var css = '' +
                '.th15-root{position:fixed;top:20%;left:12px;z-index:2147483647;font:13px/1.45 system-ui,Segoe UI,Roboto,Arial,sans-serif;-webkit-user-select:none;user-select:none;transition:transform .2s ease}' +
                '.th15-pill{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;padding:8px 12px;min-width:56px;min-height:34px;cursor:pointer;outline:none;border:1px solid var(--th15-bd);color:var(--th15-fg);' +
                'background:linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,.35)) ;' +
                'box-shadow:0 6px 24px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);}' +
                '.th15-pill:hover{transform:translateY(-1px)}' +
                '.th15-ico{width:16px;height:16px;color:var(--th15-accent)}' +
                '.th15-panel{position:absolute;left:68px;top:0;display:none;flex-direction:column;gap:10px;padding:12px;border-radius:14px;border:1px solid var(--th15-bd);' +
                'background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,.45));color:var(--th15-fg);box-shadow:0 16px 36px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.35);' +
                'backdrop-filter:saturate(180%) blur(16px);-webkit-backdrop-filter:saturate(180%) blur(16px);min-width:260px;transform-origin:left top;animation:th15-fade .16s ease-out}' +
                '@keyframes th15-fade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}' +
                '.th15-root.th15-open .th15-panel{display:flex}' +
                '.th15-row{display:flex;gap:8px;align-items:center;justify-content:space-between}' +
                '.th15-btn{appearance:none;-webkit-appearance:none;border:1px solid var(--th15-bd);background:linear-gradient(180deg,var(--th15-btnTop),var(--th15-btnBot));color:var(--th15-fg);border-radius:10px;padding:6px 12px;min-width:44px;min-height:34px;cursor:pointer;transition:transform .08s ease, box-shadow .12s ease}' +
                '.th15-btn:hover{box-shadow:0 6px 18px rgba(0,0,0,.15)}.th15-btn:active{transform:translateY(1px)}' +
                '.th15-btn--icon{min-width:36px;min-height:34px;display:flex;align-items:center;justify-content:center}' +
                '.th15-readout{font-size:18px;font-weight:800;min-width:72px;text-align:center;color:var(--th15-accent)}' +
                '.th15-input{flex:1;border:1px solid var(--th15-bd);border-radius:10px;padding:8px 10px;background:transparent;color:var(--th15-fg)}' +
                '.th15-input:focus{outline:2px solid var(--th15-focus);outline-offset:2px}' +
                '.th15-meta{display:flex;gap:10px;align-items:center;justify-content:space-between}' +
                '.th15-toggle{display:flex;gap:8px;align-items:center}' +
                '.th15-small{font-size:12px;opacity:.85}' +
                '.th15-badge{font-weight:800}' +
                '.th15-warning{position:fixed;bottom:12px;left:12px;z-index:2147483647;padding:8px 12px;border-radius:12px;border:1px solid var(--th15-bd);' +
                'background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.6));color:var(--th15-fg);box-shadow:0 8px 28px rgba(0,0,0,.18);backdrop-filter:blur(10px)}' +
                '.th15-iframe-hint{position:absolute;right:6px;top:6px;font-size:11px;padding:4px 8px;border-radius:999px;border:1px solid var(--th15-bd);background:rgba(0,0,0,.5);color:#fff;opacity:.95;pointer-events:none}' +
                ':root{--th15-bg:#ffffff;--th15-fg:#0b1220;--th15-bd:#d0d7de;--th15-focus:#2563eb;--th15-accent:#4f46e5;--th15-btnTop:#fdfefe;--th15-btnBot:#eef2f7}' +
                '@media (prefers-color-scheme: dark){:root{--th15-bg:#0b0f14;--th15-fg:#e6edf3;--th15-bd:#2e3743;--th15-focus:#4f46e5;--th15-accent:#8b7cf7;--th15-btnTop:#1a2230;--th15-btnBot:#121826}}' +
                '.th15-root[data-theme="light"]{--th15-bg:#ffffff;--th15-fg:#0b1220;--th15-bd:#d0d7de;--th15-focus:#2563eb;--th15-accent:#4f46e5;--th15-btnTop:#fdfefe;--th15-btnBot:#eef2f7}' +
                '.th15-root[data-theme="dark"]{--th15-bg:#0b0f14;--th15-fg:#e6edf3;--th15-bd:#2e3743;--th15-focus:#4f46e5;--th15-accent:#8b7cf7;--th15-btnTop:#1a2230;--th15-btnBot:#121826}';

                var styleEl = document.createElement('style');
                styleEl.setAttribute('type','text/css');
                try {
                    styleEl.appendChild(document.createTextNode(css));
                    (document.head || document.documentElement).appendChild(styleEl);
                } catch (e) {
                    // CSP fallback message later
                }

                var root = document.createElement('div');
                root.className = 'th15-root';
                root.setAttribute('role','region');
                root.setAttribute('aria-label','TimerHooker 1.5.0 — Press to adjust playback & timers');
                root.dataset.theme = settings.theme || 'system';

                var pill = document.createElement('button');
                pill.className = 'th15-pill';
                pill.setAttribute('aria-expanded','false');
                pill.setAttribute('aria-controls','th15-panel');
                var pillText = document.createElement('span');
                pillText.className = 'th15-badge th15-pill-text';
                pillText.textContent = 'x' + rateStr;
                var svgNS = 'http://www.w3.org/2000/svg';
                var ico = document.createElementNS(svgNS, 'svg'); ico.setAttribute('viewBox','0 0 24 24'); ico.setAttribute('class','th15-ico');
                var c1 = document.createElementNS(svgNS,'circle'); c1.setAttribute('cx','12'); c1.setAttribute('cy','13'); c1.setAttribute('r','7'); c1.setAttribute('fill','none'); c1.setAttribute('stroke','currentColor'); c1.setAttribute('stroke-width','2');
                var p1 = document.createElementNS(svgNS,'path'); p1.setAttribute('d','M12 8v5l3 3'); p1.setAttribute('fill','none'); p1.setAttribute('stroke','currentColor'); p1.setAttribute('stroke-width','2'); p1.setAttribute('stroke-linecap','round'); p1.setAttribute('stroke-linejoin','round');
                var p2 = document.createElementNS(svgNS,'path'); p2.setAttribute('d','M9 2h6M16 3l2 2M8 3L6 5'); p2.setAttribute('fill','none'); p2.setAttribute('stroke','currentColor'); p2.setAttribute('stroke-width','2'); p2.setAttribute('stroke-linecap','round');
                ico.appendChild(c1); ico.appendChild(p1); ico.appendChild(p2);
                pill.appendChild(ico);
                pill.appendChild(pillText);

                var panel = document.createElement('div');
                panel.className = 'th15-panel';
                panel.id = 'th15-panel';

                var rowTop = document.createElement('div');
                rowTop.className = 'th15-row';
                var btnDec = document.createElement('button'); btnDec.className = 'th15-btn th15-btn--icon th15-dec'; btnDec.title = 'Decrease'; btnDec.setAttribute('aria-label','Decrease');
                var decI = document.createElementNS(svgNS,'svg'); decI.setAttribute('viewBox','0 0 24 24'); decI.setAttribute('width','16'); decI.setAttribute('height','16');
                var decP = document.createElementNS(svgNS,'path'); decP.setAttribute('d','M5 12h14'); decP.setAttribute('stroke','currentColor'); decP.setAttribute('stroke-width','2'); decP.setAttribute('fill','none'); decP.setAttribute('stroke-linecap','round');
                decI.appendChild(decP); btnDec.appendChild(decI);
                var readout = document.createElement('div'); readout.className = 'th15-readout th15-readout-center'; readout.textContent = 'x' + rateStr;
                var btnInc = document.createElement('button'); btnInc.className = 'th15-btn th15-btn--icon th15-inc'; btnInc.title = 'Increase'; btnInc.setAttribute('aria-label','Increase');
                var incI = document.createElementNS(svgNS,'svg'); incI.setAttribute('viewBox','0 0 24 24'); incI.setAttribute('width','16'); incI.setAttribute('height','16');
                var incP1 = document.createElementNS(svgNS,'path'); incP1.setAttribute('d','M12 5v14M5 12h14'); incP1.setAttribute('stroke','currentColor'); incP1.setAttribute('stroke-width','2'); incP1.setAttribute('fill','none'); incP1.setAttribute('stroke-linecap','round');
                incI.appendChild(incP1); btnInc.appendChild(incI);
                rowTop.appendChild(btnDec); rowTop.appendChild(readout); rowTop.appendChild(btnInc);

                var rowMid = document.createElement('div');
                rowMid.className = 'th15-row';
                var btnMul = document.createElement('button'); btnMul.className = 'th15-btn th15-mul'; btnMul.textContent = '+2'; btnMul.setAttribute('aria-label','Multiply by 2');
                var btnDiv = document.createElement('button'); btnDiv.className = 'th15-btn th15-div'; btnDiv.textContent = '-2'; btnDiv.setAttribute('aria-label','Divide by 2');
                var btnReset = document.createElement('button'); btnReset.className = 'th15-btn th15-reset'; btnReset.setAttribute('aria-label','Reset to normal speed'); btnReset.title='Reset to normal speed';
                var rsI = document.createElementNS(svgNS,'svg'); rsI.setAttribute('viewBox','0 0 24 24'); rsI.setAttribute('width','16'); rsI.setAttribute('height','16');
                var rsP = document.createElementNS(svgNS,'path'); rsP.setAttribute('d','M3 12a9 9 0 1 0 3-6.7M3 4v4h4'); rsP.setAttribute('stroke','currentColor'); rsP.setAttribute('stroke-width','2'); rsP.setAttribute('fill','none'); rsP.setAttribute('stroke-linecap','round'); rsP.setAttribute('stroke-linejoin','round');
                rsI.appendChild(rsP); btnReset.appendChild(rsI);
                rowMid.appendChild(btnMul); rowMid.appendChild(btnDiv); rowMid.appendChild(btnReset);

                var rowInput = document.createElement('div');
                rowInput.className = 'th15-row';
                var input = document.createElement('input'); input.className = 'th15-input th15-exact'; input.type = 'number'; input.min = '0.0625'; input.max = '16'; input.step = '0.05'; input.inputMode = 'decimal'; input.placeholder = 'Set exact (e.g., 2.5)'; input.setAttribute('aria-label','Set exact multiplier');
                var btnSet = document.createElement('button'); btnSet.className = 'th15-btn th15-set'; btnSet.textContent = 'Set';
                rowInput.appendChild(input); rowInput.appendChild(btnSet);

                var rowMeta = document.createElement('div');
                rowMeta.className = 'th15-meta';
                var leftToggles = document.createElement('div'); leftToggles.className = 'th15-toggle';
                var pin = document.createElement('input'); pin.type = 'checkbox'; pin.className = 'th15-pin'; pin.checked = !!settings.pinned; pin.id = 'th15-pin';
                var pinLbl = document.createElement('label'); pinLbl.htmlFor = 'th15-pin'; pinLbl.className='th15-small'; pinLbl.textContent = 'Pin';
                var sync = document.createElement('input'); sync.type = 'checkbox'; sync.className = 'th15-sync'; sync.checked = !!settings.syncAcrossTabs; sync.id = 'th15-sync';
                var syncLbl = document.createElement('label'); syncLbl.htmlFor = 'th15-sync'; syncLbl.className='th15-small'; syncLbl.textContent = 'Sync tabs';
                var stIframe = document.createElement('input'); stIframe.type='checkbox'; stIframe.className='th15-send-ifr'; stIframe.checked = !!settings.sendToIframes; stIframe.id = 'th15-ifr';
                var stIframeLbl = document.createElement('label'); stIframeLbl.htmlFor='th15-ifr'; stIframeLbl.className='th15-small'; stIframeLbl.textContent='Send iframes';
                leftToggles.appendChild(pin); leftToggles.appendChild(pinLbl); leftToggles.appendChild(sync); leftToggles.appendChild(syncLbl); leftToggles.appendChild(stIframe); leftToggles.appendChild(stIframeLbl);

                var rightToggles = document.createElement('div'); rightToggles.className='th15-toggle';
                var themeSel = document.createElement('select'); themeSel.className='th15-theme'; themeSel.setAttribute('aria-label','Theme');
                ;['system','light','dark'].forEach(function(v){ var o=document.createElement('option'); o.value=v; o.textContent=v; if((settings.theme||'system')===v){o.selected=true;} themeSel.appendChild(o); });
                var exclude = document.createElement('input'); exclude.type='checkbox'; exclude.className='th15-exclude'; exclude.checked=!!settings.excluded; exclude.id='th15-exclude';
                var excludeLbl = document.createElement('label'); excludeLbl.htmlFor='th15-exclude'; excludeLbl.className='th15-small'; excludeLbl.textContent='Exclude site';
                rightToggles.appendChild(themeSel); rightToggles.appendChild(exclude); rightToggles.appendChild(excludeLbl);

                rowMeta.appendChild(leftToggles); rowMeta.appendChild(rightToggles);

                panel.appendChild(rowTop); panel.appendChild(rowMid); panel.appendChild(rowInput); panel.appendChild(rowMeta);
                root.appendChild(pill); root.appendChild(panel);

                var mount = function(){
                    try { document.body.appendChild(root); } catch(e) {}
                    if (!(settings.pinned)) { root.style.position='absolute'; root.style.top='auto'; root.style.left='12px'; root.style.bottom='12px'; }
                    // restore saved position if present
                    try {
                        if (settings.pos && typeof settings.pos.top === 'number' && typeof settings.pos.left === 'number'){
                            root.style.top = settings.pos.top + 'px';
                            root.style.left = settings.pos.left + 'px';
                        }
                    } catch(e) {}
                };

                // interactions
                var setExpanded = function(open){
                    if (open) { root.classList.add('th15-open'); pill.setAttribute('aria-expanded','true'); }
                    else { root.classList.remove('th15-open'); pill.setAttribute('aria-expanded','false'); }
                };
                // expand/collapse
                pill.addEventListener('click', function(ev){
                    if (ev.shiftKey) return; // reserved for dragging
                    setExpanded(!root.classList.contains('th15-open'));
                });
                btnInc.addEventListener('click', function(){ changeTime(1,0,true); });
                btnDec.addEventListener('click', function(){ changeTime(-1,0,true); });
                btnMul.addEventListener('click', function(){ changeTime(0,2); });
                btnDiv.addEventListener('click', function(){ changeTime(0,-2); });
                btnReset.addEventListener('click', function(){ changeTime(0,0,false,true); });
                btnSet.addEventListener('click', function(){ var v=parseFloat(input.value); if(isFinite(v)&&v>0){ timerContext.change(1/ v); } });

                pin.addEventListener('change', function(){ settings.pinned = !!pin.checked; ns.saveSettings(settings); mount(); });
                sync.addEventListener('change', function(){ settings.syncAcrossTabs = !!sync.checked; ns.saveSettings(settings); });
                stIframe.addEventListener('change', function(){ settings.sendToIframes = !!stIframe.checked; ns.saveSettings(settings); });
                themeSel.addEventListener('change', function(){ settings.theme = themeSel.value; ns.saveSettings(settings); root.dataset.theme = settings.theme; });
                exclude.addEventListener('change', function(){ settings.excluded = !!exclude.checked; ns.saveSettings(settings); if (settings.excluded) { setExpanded(false); }});

                // collapse on outside click / Escape
                document.addEventListener('mousedown', function(ev){ if (!root.contains(ev.target)) setExpanded(false); });
                document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape') setExpanded(false); });

                // drag to move (Shift + drag the pill)
                var dragging = false, sx = 0, sy = 0, st = 0, sl = 0;
                var onMove = function(ev){ if(!dragging) return; var dy = ev.clientY - sy; var dx = ev.clientX - sx; var nt = Math.max(4, st + dy); var nl = Math.max(4, sl + dx); root.style.top = nt + 'px'; root.style.left = nl + 'px'; };
                var onUp = function(){ if(!dragging) return; dragging=false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); try { settings.pos = { top: parseInt(root.style.top||'0')||0, left: parseInt(root.style.left||'0')||0 }; ns.saveSettings(settings);} catch(e) {} };
                pill.addEventListener('mousedown', function(ev){ if(!ev.shiftKey) return; ev.preventDefault(); setExpanded(false); dragging=true; sx = ev.clientX; sy = ev.clientY; st = parseInt((root.style.top||'').replace('px',''))||root.getBoundingClientRect().top; sl = parseInt((root.style.left||'').replace('px',''))||root.getBoundingClientRect().left; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); });

                if (!global.isDOMLoaded) {
                    document.addEventListener('readystatechange', function () {
                        if ((document.readyState === 'interactive' || document.readyState === 'complete') && !global.isDOMRendered) {
                            mount();
                            global.isDOMRendered = true;
                            console.log('TimerHooker UI mounted');
                        }
                    });
                } else {
                    mount();
                    global.isDOMRendered = true;
                    console.log('TimerHooker UI mounted');
                }

                // CSP fallback notice if styles are blocked
                try {
                    var cs = getComputedStyle(pill);
                    if (!cs || !cs.borderRadius) {
                        throw new Error('style blocked');
                    }
                } catch(e) {
                    var warn = document.createElement('div');
                    warn.className='th15-warning';
                    warn.textContent='Injection blocked by site (CSP / sandbox). Click to learn more.';
                    warn.title='Injection blocked by site (CSP / sandbox). Click to learn more.';
                    warn.addEventListener('click', function(){ window.open('https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', '_blank'); });
                    try { document.body.appendChild(warn); } catch(err) {}
                }
            },
            applyGlobalAction: function (timer) {
                // Method of clicking the semicircle button on the interface
                timer.changeTime = function (anum, cnum, isa, isr) {
                    if (isr) {
                        global.timer.change(1);
                        return;
                    }
                    if (!global.timer) {
                        return;
                    }
                    var result;
                    if (!anum && !cnum) {
                        var t = prompt("Enter the desired change rate of the timer change（current：" + 1 / timerContext._percentage + "）");
                        if (t == null) {
                            return;
                        }
                        if (isNaN(parseFloat(t))) {
                            alert("Please enter the correct number");
                            timer.changeTime();
                            return;
                        }
                        if (parseFloat(t) <= 0) {
                            alert("The magnification cannot be less than or equal to 0");
                            timer.changeTime();
                            return;
                        }
                        result = 1 / parseFloat(t);
                    } else {
                        if (isa && anum) {
                            if (1 / timerContext._percentage <= 1 && anum < 0) {
                                return;
                            }
                            result = 1 / (1 / timerContext._percentage + anum);
                        } else {
                            if (cnum <= 0) {
                                cnum = 1 / -cnum
                            }
                            result = 1 / ((1 / timerContext._percentage) * cnum);
                        }
                    }
                    timer.change(result);
                };
                global.changeTime = timer.changeTime;
            },
            applyHooking: function () {
                var _this = this;
                // Hijack the loop timer
                eHookContext.hookReplace(window, 'setInterval', function (setInterval) {
                    return _this.getHookedTimerFunction('interval', setInterval);
                });
                // Hijack a single timer
                eHookContext.hookReplace(window, 'setTimeout', function (setTimeout) {
                    return _this.getHookedTimerFunction('timeout', setTimeout)
                });
                // Hijack the clear method of the loop timer
                eHookContext.hookBefore(window, 'clearInterval', function (method, args) {
                    _this.redirectNewestId(args);
                });
                // Hijack the clear method of the loop timer
                eHookContext.hookBefore(window, 'clearTimeout', function (method, args) {
                    _this.redirectNewestId(args);
                });
                var newFunc = this.getHookedDateConstructor();
                eHookContext.hookClass(window, 'Date', newFunc, '_innerDate', ['now']);
                Date.now = function () {
                    return new Date().getTime();
                };
                eHookContext.hookedToString(timerContext._Date.now, Date.now);
                var objToString = Object.prototype.toString;

                Object.prototype.toString = function toString() {
                    'use strict';
                    if (this instanceof timerContext._mDate) {
                        return '[object Date]';
                    } else {
                        return objToString.call(this);
                    }
                };

                eHookContext.hookedToString(objToString, Object.prototype.toString);
                eHookContext.hookedToString(timerContext._setInterval, setInterval);
                eHookContext.hookedToString(timerContext._setTimeout, setTimeout);
                eHookContext.hookedToString(timerContext._clearInterval, clearInterval);
                timerContext._mDate = window.Date;
                this.hookShadowRoot();
            },
            getHookedDateConstructor: function () {
                return function () {
                    if (arguments.length === 1) {
                        Object.defineProperty(this, '_innerDate', {
                            configurable: false,
                            enumerable: false,
                            value: new timerContext._Date(arguments[0]),
                            writable: false
                        });
                        return;
                    } else if (arguments.length > 1) {
                        var definedValue;
                        switch (arguments.length) {
                            case 2:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1]
                                );
                                break;
                            case 3:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                );
                                break;
                            case 4:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                );
                                break;
                            case 5:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                    arguments[4]
                                );
                                break;
                            case 6:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                    arguments[4],
                                    arguments[5]
                                );
                                break;
                            default:
                            case 7:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                    arguments[4],
                                    arguments[5],
                                    arguments[6]
                                );
                                break;
                        }

                        Object.defineProperty(this, '_innerDate', {
                            configurable: false,
                            enumerable: false,
                            value: definedValue,
                            writable: false
                        });
                        return;
                    }
                    var now = timerContext._Date.now();
                    var passTime = now - timerContext.__lastDatetime;
                    var hookPassTime = passTime * (1 / timerContext._percentage);
                    // console.log(__this.__lastDatetime + hookPassTime, now,__this.__lastDatetime + hookPassTime - now);
                    Object.defineProperty(this, '_innerDate', {
                        configurable: false,
                        enumerable: false,
                        value: new timerContext._Date(timerContext.__lastMDatetime + hookPassTime),
                        writable: false
                    });
                };
            },
            getHookedTimerFunction: function (type, timer) {
                var property = '_' + type + 'Ids';
                return function () {
                    var uniqueId = timerContext.genUniqueId();
                    var callback = arguments[0];
                    if (typeof callback === 'string') {
                        callback += ';timer.notifyExec(' + uniqueId + ')';
                        arguments[0] = callback;
                    }
                    if (typeof callback === 'function') {
                        arguments[0] = function () {
                            var returnValue = callback.apply(this, arguments);
                            timerContext.notifyExec(uniqueId);
                            return returnValue;
                        }
                    }
                    // save the original time interval
                    var originMS = arguments[1];
                    // Get variable speed interval
                    arguments[1] *= timerContext._percentage;
                    var resultId = timer.apply(window, arguments);
                    // Save the id and parameters obtained each time the timer is used
                    timerContext[property][resultId] = {
                        args: arguments,
                        originMS: originMS,
                        originId: resultId,
                        nowId: resultId,
                        uniqueId: uniqueId,
                        oldPercentage: timerContext._percentage,
                        exceptNextFireTime: timerContext._Date.now() + originMS
                    };
                    return resultId;
                };
            },
            redirectNewestId: function (args) {
                var id = args[0];
                if (timerContext._intervalIds[id]) {
                    args[0] = timerContext._intervalIds[id].nowId;
                    // clear this recordid
                    delete timerContext._intervalIds[id];
                }
                if (timerContext._timeoutIds[id]) {
                    args[0] = timerContext._timeoutIds[id].nowId;
                    // clear this recordid
                    delete timerContext._timeoutIds[id];
                }
            },
            registerShortcutKeys: function (timer) {
                // Shortcut key registration (configurable)
                if (timer._onKeydown) {
                    removeEventListener('keydown', timer._onKeydown);
                }
                var ns = window.__TimerHooker__ || {};
                var s = ns.settings || (ns.loadSettings ? ns.loadSettings() : {});
                var parse = function(def){
                    var parts = (def||'').split('+');
                    var need = { ctrl:false, alt:false, shift:false, key:'' };
                    for (var i=0;i<parts.length;i++){
                        var p = parts[i].trim().toLowerCase();
                        if (p==='ctrl' || p==='control') need.ctrl = true;
                        else if (p==='alt') need.alt = true;
                        else if (p==='shift') need.shift = true;
                        else need.key = p;
                    }
                    return need;
                };
                var hk = {
                    increase: parse((s.hotkeys && s.hotkeys.increase) || 'Alt+Shift+ArrowUp'),
                    decrease: parse((s.hotkeys && s.hotkeys.decrease) || 'Alt+Shift+ArrowDown'),
                    multiply: parse((s.hotkeys && s.hotkeys.multiply) || 'Ctrl+Alt+='),
                    divide: parse((s.hotkeys && s.hotkeys.divide) || 'Ctrl+Alt+-'),
                    reset: parse((s.hotkeys && s.hotkeys.reset) || 'Ctrl+Alt+0'),
                    prompt: parse((s.hotkeys && s.hotkeys.prompt) || 'Ctrl+Alt+9')
                };
                var match = function(e, keyCfg){
                    if (!keyCfg) return false;
                    if (!!keyCfg.ctrl !== !!e.ctrlKey) return false;
                    if (!!keyCfg.alt !== !!e.altKey) return false;
                    if (!!keyCfg.shift !== !!e.shiftKey) return false;
                    var k = (e.key||'').toLowerCase();
                    var code = (e.code||'').toLowerCase();
                    return k === keyCfg.key || code === keyCfg.key;
                };
                timer._onKeydown = function (e) {
                    try {
                        if (match(e, hk.prompt)) { e.preventDefault(); timer.changeTime(); return; }
                        if (match(e, hk.increase)) { e.preventDefault(); timer.changeTime(1, 0, true); return; }
                        if (match(e, hk.decrease)) { e.preventDefault(); timer.changeTime(-1, 0, true); return; }
                        if (match(e, hk.multiply)) { e.preventDefault(); timer.changeTime(0, 2); return; }
                        if (match(e, hk.divide)) { e.preventDefault(); timer.changeTime(0, -2); return; }
                        if (match(e, hk.reset)) { e.preventDefault(); timer.changeTime(0, 0, false, true); return; }
                    } catch(err) {}
                };
                addEventListener('keydown', timer._onKeydown, { passive: false });
            },
            /**
             * Callback method called when the timer rate is changed
             * @param percentage
             * @private
             */
            percentageChangeHandler: function (percentage) {
                // Change all loop timings
                util.ergodicObject(timerContext, timerContext._intervalIds, function (idObj, id) {
                    idObj.args[1] = Math.floor((idObj.originMS || 1) * percentage);
                    // End the original timer
                    this._clearInterval.call(window, idObj.nowId);
                    // start a new timer
                    idObj.nowId = this._setInterval.apply(window, idObj.args);
                });
                // Change all delay timings
                util.ergodicObject(timerContext, timerContext._timeoutIds, function (idObj, id) {
                    var now = this._Date.now();
                    var exceptTime = idObj.exceptNextFireTime;
                    var oldPercentage = idObj.oldPercentage;
                    var time = exceptTime - now;
                    if (time < 0) {
                        time = 0;
                    }
                    var changedTime = Math.floor(percentage / oldPercentage * time);
                    idObj.args[1] = changedTime;
                    // Reschedule the next execution time
                    idObj.exceptNextFireTime = now + changedTime;
                    idObj.oldPercentage = percentage;
                    // end the original timer
                    this._clearTimeout.call(window, idObj.nowId);
                    // start a new timer
                    idObj.nowId = this._setTimeout.apply(window, idObj.args);
                });
            },
            hookShadowRoot: function () {
                var origin = Element.prototype.attachShadow;
                eHookContext.hookAfter(Element.prototype, 'attachShadow',
                    function (m, args, result) {
                        extraElements.push(result);
                        return result;
                    }, false);
                eHookContext.hookedToString(origin, Element.prototype.attachShadow);
            },
            hookDefine: function () {
                const _this = this;
                eHookContext.hookBefore(Object, 'defineProperty', function (m, args) {
                    var option = args[2];
                    var ele = args[0];
                    var key = args[1];
                    var afterArgs = _this.hookDefineDetails(ele, key, option);
                    afterArgs.forEach((arg, i) => {
                        args[i] = arg;
                    })
                });
                eHookContext.hookBefore(Object, 'defineProperties', function (m, args) {
                    var option = args[1];
                    var ele = args[0];
                    if (ele && ele instanceof Element) {
                        Object.keys(option).forEach(key => {
                            var o = option[key];
                            var afterArgs = _this.hookDefineDetails(ele, key, o);
                            args[0] = afterArgs[0];
                            delete option[key];
                            option[afterArgs[1]] = afterArgs[2]
                        })
                    }
                })
            },
            hookDefineDetails: function (target, key, option) {
                if (option && target && target instanceof Element && typeof key === 'string' && key.indexOf('on') >= 0) {
                    option.configurable = true;
                }
                if ((target instanceof HTMLVideoElement || target instanceof HTMLAudioElement) && key === 'playbackRate') {
                    option.configurable = true;
                    console.warn('[Timer Hook]', 'Default action video magnification blocked');
                    key = 'playbackRate_hooked'
                }
                return [target, key, option];
            },
            suppressEvent: function (ele, eventName) {
                if (ele) {
                    delete ele['on' + eventName];
                    ele['on' + eventName] = undefined;
                }
                if (!suppressEvents[eventName]) {
                    eHookContext.hookBefore(EventTarget.prototype, 'addEventListener',
                        function (m, args) {
                            var eName = args[0];
                            if (eventName === eName) {
                                console.warn(eventName, 'event suppressed.')
                                args[0] += 'suppressed';
                            }
                        }, false);
                    suppressEvents[eventName] = true;
                }
            },
            changePlaybackRate: function (ele, rate) {
                try {
                delete ele.playbackRate;
                    ele.playbackRate = rate;
                if (rate !== 1) {
                    timerContext.defineProperty.call(Object, ele, 'playbackRate', {
                        configurable: true,
                            get: function () { return 1; },
                            set: function () {}
                        });
                    }
                } catch (e) {
                    try { ele.setAttribute('title','Paused: site prevented playback changes'); } catch(err) {}
                }
            }
        }
    };

    var normalUtil = {
        isInIframe: function () {
            let is = global.parent !== global;
            try {
                is = is && global.parent.document.body.tagName !== 'FRAMESET'
            } catch (e) {
                // ignore
            }
            return is;
        },
        listenParentEvent: function (handler) {
            global.addEventListener('message', function (e) {
                var data = e.data;
                var type = data.type || '';
                if (type === 'changePercentage') {
                    handler(data.percentage || 0);
                }
            })
        },
        sentChangesToIframe: function (percentage) {
            var iframes = document.querySelectorAll('iframe') || [];
            var frames = document.querySelectorAll('frame');
            if (iframes.length) {
                for (var i = 0; i < iframes.length; i++) {
                    iframes[i].contentWindow.postMessage(
                        {type: 'changePercentage', percentage: percentage}, '*');
                }
            }
            if (frames.length) {
                for (var j = 0; j < frames.length; j++) {
                    frames[j].contentWindow.postMessage(
                        {type: 'changePercentage', percentage: percentage}, '*');
                }
            }
        }
    };

    var getStorageKey = function () {
        return '__th_percentage__:' + location.hostname;
    };

    var querySelectorAll = function (ele, selector, includeExtra) {
        var elements = ele.querySelectorAll(selector);
        elements = Array.prototype.slice.call(elements || []);
        if (includeExtra) {
            extraElements.forEach(function (element) {
                elements = elements.concat(querySelectorAll(element, selector, false));
            })
        }
        return elements;
    };

    var generate = function () {
        return function (util) {
            // disable worker
            workerURLs.forEach(function (url) {
                if (util.urlMatching(location.href, 'http.*://.*' + url + '.*')) {
                    window['Worker'] = undefined;
                    console.log('Worker disabled');
                }
            });
            var eHookContext = this;
            var timerHooker = {
                // Used to store the id and parameters of the timer
                _intervalIds: {},
                _timeoutIds: {},
                _auoUniqueId: 1,
                // timer rate
                __percentage: 1.0,
                // Original method before hijacking
                _setInterval: window['setInterval'],
                _clearInterval: window['clearInterval'],
                _clearTimeout: window['clearTimeout'],
                _setTimeout: window['setTimeout'],
                _Date: window['Date'],
                __lastDatetime: new Date().getTime(),
                __lastMDatetime: new Date().getTime(),
                videoSpeedInterval: 1000,
                defineProperty: Object.defineProperty,
                defineProperties: Object.defineProperties,
                _onEnsureUIAlive: null,
                _ensureAliveIntervalId: null,
                _onKeydown: null,
                _mutationObservers: [],
                genUniqueId: function () {
                    return this._auoUniqueId++;
                },
                notifyExec: function (uniqueId) {
                    var _this = this;
                    if (uniqueId) {
                        // clear timeout stored records
                        var timeoutInfos = Object.values(this._timeoutIds).filter(
                            function (info) {
                                return info.uniqueId === uniqueId;
                            }
                        );
                        timeoutInfos.forEach(function (info) {
                            _this._clearTimeout.call(window, info.nowId);
                            delete _this._timeoutIds[info.originId]
                        })
                    }
                    // console.log(uniqueId, 'called')
                },
                /**
                 * initialization method
                 */
                init: function () {
                    var timerContext = this;
                    var h = helper(eHookContext, timerContext, util);
                    try { (window.__TimerHooker__ = window.__TimerHooker__ || {}).timer = timerContext; } catch(e) {}

                    h.hookDefine();
                    h.applyHooking();

                    // Set the callback when the percentage property is modified
                    Object.defineProperty(timerContext, '_percentage', {
                        get: function () {
                            return timerContext.__percentage;
                        },
                        set: function (percentage) {
                            if (percentage === timerContext.__percentage) {
                                return percentage;
                            }
                            h.percentageChangeHandler(percentage);
                            timerContext.__percentage = percentage;
                            return percentage;
                        }
                    });

                    var ns = window.__TimerHooker__ || {};
                    var settings = (ns.loadSettings && ns.loadSettings()) || (ns.defaults || {});
                    ns.settings = settings;

                    var savedPercentage = parseFloat((function(){ try { return localStorage.getItem(getStorageKey()); } catch(e) { return ''; } })() || '');
                    this._savedPercentage = isFinite(savedPercentage) && savedPercentage > 0 ? savedPercentage : null;

                    if (settings && settings.excluded) {
                        // respect user choice: no UI/shortcuts; keep timers normal
                        if (this._savedPercentage && this._savedPercentage !== 1) {
                            this.change(1);
                        }
                        window.addEventListener('beforeunload', this.destroy.bind(this));
                        return;
                    }

                    if (!normalUtil.isInIframe()) {
                        console.log('[TimeHooker]', 'loading outer window...');
                        h.applyUI();
                        h.applyGlobalAction(timerContext);
                        h.registerShortcutKeys(timerContext);
                        this._onEnsureUIAlive = this.ensureUIAlive.bind(this);
                        this.ensureUIAlive();
                        this._ensureAliveIntervalId = this._setInterval.call(window, this._onEnsureUIAlive, 1500);
                        window.addEventListener('yt-navigate-finish', this._onEnsureUIAlive);
                        window.addEventListener('spfdone', this._onEnsureUIAlive);
                        try { this.showWelcomeBubble && this.showWelcomeBubble(); } catch(e) {}
                        // cross-tab sync
                        window.addEventListener('storage', (function(ev){
                            try {
                                if (!ns.settings || ns.settings.syncAcrossTabs !== true) return;
                                if (!ev) return;
                                if (ev.key === (ns.getPercentageKey ? ns.getPercentageKey() : getStorageKey())) {
                                    var p = parseFloat(ev.newValue || '');
                                    if (isFinite(p) && p > 0) { this.change(p); }
                                }
                                if (ev.key === ns._settingsKey) {
                                    ns.settings = ns.loadSettings ? ns.loadSettings() : ns.settings;
                                    var root = document.querySelector('.th15-root');
                                    if (root) { root.dataset.theme = ns.settings.theme || 'system'; }
                                }
                            } catch(e) {}
                        }).bind(this));
                        if (this._savedPercentage) {
                            this.change(this._savedPercentage);
                        }
                        window.addEventListener('beforeunload', this.destroy.bind(this));
                        // observers and watchdogs
                        try { this.observeMedia(); } catch(e) {}
                        try { this._setInterval.call(window, this.observeMedia.bind(this), this.videoSpeedInterval); } catch(e) {}
                        try { this.observeHeadForCSP && this.observeHeadForCSP(); } catch(e) {}
                        try { this.startHookWatchdog && this.startHookWatchdog(); } catch(e) {}
                        try { this.attachIframeHints && this.attachIframeHints(); } catch(e) {}
                        try { window.addEventListener('resize', (this.attachIframeHints||function(){}).bind(this)); } catch(e) {}
                    } else {
                        console.log('[TimeHooker]', 'loading inner window...');
                        normalUtil.listenParentEvent((function (percentage) {
                            console.log('[TimeHooker]', 'Inner Changed', percentage)
                            this.change(percentage);
                        }).bind(this))
                        if (this._savedPercentage) {
                            this.change(this._savedPercentage);
                        }
                        window.addEventListener('beforeunload', this.destroy.bind(this));
                    }
                    this._observedRoots = new WeakSet();
                },
                showWelcomeBubble: function(){
                    try {
                        var ns = window.__TimerHooker__ || {};
                        var key = '__th_welcome__:' + location.hostname;
                        var shown = false;
                        try { shown = localStorage.getItem(key) === '1'; } catch(e) {}
                        if (shown) return;
                        var bubble = document.createElement('div');
                        bubble.className='th15-warning';
                        bubble.textContent='TimerHooker 1.5.0 — Press to adjust playback & timers. Click to dismiss.';
                        bubble.title='TimerHooker 1.5.0 — Press to adjust playback & timers';
                        bubble.addEventListener('click', function(){ try{ localStorage.setItem(key,'1'); }catch(e){} bubble.remove(); });
                        document.body && document.body.appendChild(bubble);
                    } catch(e) {}
                },
                /**
                 * Call this method to change the timer rate
                 * @param percentage
                 */
                change: function (percentage) {
                    this.__lastMDatetime = this._mDate.now();
                    this.__lastDatetime = this._Date.now();
                    this._percentage = percentage;
                    var oldNode = document.getElementsByClassName('_th-click-hover');
                    var oldNode1 = document.getElementsByClassName('_th_times');
                    var displayNum = (1 / this._percentage).toFixed(2);
                    if (oldNode[0]) oldNode[0].textContent = 'x' + displayNum;
                    if (oldNode1[0]) oldNode1[0].textContent = 'x' + displayNum;
                    var pillText = document.getElementsByClassName('th15-pill-text')[0];
                    if (pillText) pillText.textContent = 'x' + displayNum;
                    var readout = document.getElementsByClassName('th15-readout-center')[0];
                    if (readout) readout.textContent = 'x' + displayNum;
                    var a = document.getElementsByClassName('_th_cover-all-show-times')[0] || {};
                    a.className = '_th_cover-all-show-times';
                    this._setTimeout.bind(window)(function () {
                        a.className = '_th_cover-all-show-times _th_hidden';
                    }, 100);
                    this.changeVideoSpeed();
                    try { localStorage.setItem(getStorageKey(), String(percentage)); } catch (e) {}
                    try {
                        var ns = window.__TimerHooker__ || {};
                        if (ns.settings && ns.settings.syncAcrossTabs === true) {
                            // writing the same key already syncs; above setItem triggers storage in other tabs
                        }
                        if (!ns.settings || ns.settings.sendToIframes !== false) {
                    normalUtil.sentChangesToIframe(percentage);
                        }
                    } catch (e) {}
                },
                changeVideoSpeed: function () {
                    var timerContext = this;
                    var h = helper(eHookContext, timerContext, util);
                    var rate = 1 / this._percentage;
                    rate > 16 && (rate = 16);
                    rate < 0.065 && (rate = 0.065);
                    var medias = querySelectorAll(document, 'video, audio', true) || [];
                    if (medias.length) {
                        for (var i = 0; i < medias.length; i++) {
                            h.changePlaybackRate(medias[i], rate);
                        }
                    }
                },
                ensureUIAlive: function () {
                    var n = document.querySelector('.th15-root');
                    if (!n) {
                        var h = helper(eHookContext, this, util);
                        h.applyUI();
                    }
                },
                observeMedia: function () {
                    var h = helper(eHookContext, this, util);
                    var rate = 1 / this._percentage;
                    rate > 16 && (rate = 16);
                    rate < 0.065 && (rate = 0.065);
                    var roots = [document].concat(extraElements || []);
                    this._observedRoots || (this._observedRoots = new WeakSet());
                    for (var i = 0; i < roots.length; i++) {
                        var root = roots[i];
                        if (!root) continue;
                        if (!this._observedRoots.has(root)) {
                            this._observedRoots.add(root);
                            var mo = new MutationObserver((function (mutations) {
                                for (var j = 0; j < mutations.length; j++) {
                                    var m = mutations[j];
                                    var nodes = m.addedNodes || [];
                                    for (var k = 0; k < nodes.length; k++) {
                                        var node = nodes[k];
                                        if (!node || node.nodeType !== 1) continue;
                                        if (node.matches && node.matches('video, audio')) {
                                            h.changePlaybackRate(node, rate);
                                        }
                                        var q = node.querySelectorAll ? node.querySelectorAll('video, audio') : [];
                                        for (var x = 0; x < q.length; x++) {
                                            h.changePlaybackRate(q[x], rate);
                                        }
                                    }
                                }
                            }).bind(this));
                            mo.observe(root, {subtree: true, childList: true});
                            this._mutationObservers || (this._mutationObservers = []);
                            this._mutationObservers.push(mo);
                        }
                        var existing = root.querySelectorAll ? root.querySelectorAll('video, audio') : [];
                        for (var z = 0; z < existing.length; z++) {
                            h.changePlaybackRate(existing[z], rate);
                        }
                    }
                },
                observeHeadForCSP: function () {
                    try {
                        if (!document.head) return;
                        var show = function(){
                            if (document.querySelector('.th15-warning')) return;
                            var warn = document.createElement('div');
                            warn.className='th15-warning';
                            warn.textContent='Injection blocked by site (CSP / sandbox). Click to learn more.';
                            warn.title='Injection blocked by site (CSP / sandbox). Click to learn more.';
                            warn.addEventListener('click', function(){ window.open('https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', '_blank'); });
                            document.body && document.body.appendChild(warn);
                        };
                        var mo = new MutationObserver(function(muts){
                            for (var i=0;i<muts.length;i++){
                                var m = muts[i];
                                var nodes = m.addedNodes || [];
                                for (var j=0;j<nodes.length;j++){
                                    var n = nodes[j];
                                    if (n && n.tagName === 'META'){
                                        var heq = (n.getAttribute('http-equiv')||'').toLowerCase();
                                        if (heq === 'content-security-policy'){ show(); return; }
                                    }
                                }
                            }
                        });
                        mo.observe(document.head, { childList: true });
                        this._mutationObservers.push(mo);
                    } catch(e) {}
                },
                startHookWatchdog: function () {
                    try {
                        var _this = this;
                        var h = helper(eHookContext, this, util);
                        var check = function(){
                            try {
                                if (!window.eHook) return;
                                var ok1 = window.eHook.isHooked(window, 'setTimeout');
                                var ok2 = window.eHook.isHooked(window, 'setInterval');
                                if (!ok1 || !ok2) {
                                    h.applyHooking();
                                }
                            } catch(e) {}
                        };
                        check();
                        this._setInterval.call(window, check, 3000);
                    } catch(e) {}
                },
                attachIframeHints: function () {
                    try {
                        var hints = document.querySelectorAll('.th15-iframe-hint');
                        for (var i=0;i<hints.length;i++){ hints[i].parentNode && hints[i].parentNode.removeChild(hints[i]); }
                        var iframes = document.querySelectorAll('iframe');
                        for (var j=0;j<iframes.length;j++){
                            var f = iframes[j];
                            var blocked = false;
                            try { var doc = f.contentDocument; blocked = !doc; } catch(e){ blocked = true; }
                            if (!blocked && f.hasAttribute('sandbox')){
                                var sb = (f.getAttribute('sandbox')||'').toLowerCase();
                                if (sb.indexOf('allow-same-origin') === -1) blocked = true;
                            }
                            if (blocked){
                                var r = f.getBoundingClientRect();
                                var hint = document.createElement('div');
                                hint.className='th15-iframe-hint';
                                hint.textContent='iframe blocked by site';
                                hint.style.position='fixed';
                                hint.style.left = (r.left + 6) + 'px';
                                hint.style.top = (r.top + 6) + 'px';
                                hint.style.zIndex = '2147483647';
                                hint.style.pointerEvents = 'none';
                                document.body && document.body.appendChild(hint);
                            }
                        }
                    } catch(e) {}
                },
                destroy: function () {
                    try {
                        if (this._ensureAliveIntervalId) {
                            this._clearInterval.call(window, this._ensureAliveIntervalId);
                            this._ensureAliveIntervalId = null;
                        }
                        if (this._onEnsureUIAlive) {
                            window.removeEventListener('yt-navigate-finish', this._onEnsureUIAlive);
                            window.removeEventListener('spfdone', this._onEnsureUIAlive);
                        }
                        if (this._onKeydown) {
                            window.removeEventListener('keydown', this._onKeydown);
                            this._onKeydown = null;
                        }
                        (this._mutationObservers || []).forEach(function (observer) {
                            try { observer.disconnect(); } catch (e) {}
                        });
                        this._mutationObservers = [];
                    } catch (e) {}
                },
                suppressVisibility: function () {
                    var h = helper(eHookContext, this, util);
                    h.suppressEvent(document, 'visibilitychange');
                }
            };
            // default initialization
            timerHooker.init();
            return timerHooker;
        }
    };

    if (global.eHook) {
        global.eHook.plugins({
            name: 'timer',
            /**
             * Plugin loading
             * @param util
             */
            mount: generate()
        });
    } else {
        (function () {
            var tries = 0;
            var iv = global.setInterval(function () {
                if (global.eHook) {
                    global.clearInterval(iv);
                    global.eHook.plugins({
                        name: 'timer',
                        /**
                         * Plugin loading
                         * @param util
                         */
                        mount: generate()
                    });
                } else if (++tries > 200) {
                    global.clearInterval(iv);
                }
            }, 50);
        })();
    }
}(window);
