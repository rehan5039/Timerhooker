# TimerHooker 1.5.0

- **Description**
  Modern compact UI to adjust page timer speed and media playback rate. Accessible, theme-aware, mobile-friendly. Best-effort, ethical behavior with graceful fallbacks (no bypassing site protections).

- **Install**
  - GreasyFork Script install page: `https://greasyfork.org/en/scripts/553657-timerhooker-2026`
  - Install via Tampermonkey/Greasemonkey by visiting the URL above.

- **Usage**
  - A small vertical pill shows the current multiplier (e.g., `x2.5`). Click to expand controls.
  - Controls: +, −, ×2, ÷2, Reset, and an input for exact multiplier. Theme selector, Pin/Unpin, Sync across tabs, Send to iframes, and Exclude site toggles are available.
  - Keyboard shortcuts (configurable in UI):
    - Alt + Shift + ArrowUp → increase (step +2)
    - Alt + Shift + ArrowDown → decrease (step -2)
    - Ctrl + Alt + = → multiply (×2)
    - Ctrl + Alt + - → divide (÷2)
    - Ctrl + Alt + 0 → reset to 1×
    - Ctrl + Alt + 9 → prompt custom speed
     

- **Dependency**
  - Uses Everything-Hook (loaded via `@require`).
<!--
 - **Userscript Metadata**
   - `@match`:
     - `*://*/*`
     - `file:///*`
   - `@run-at`: document-start
   - `@inject-into`: page
   - `@license`: GPL-3.0-or-later
   - `@namespace`: https://rehan5039.github.io/
   - `@author`: rehan
-->
 - **Notes**
   - If a site enforces playbackRate or event properties, the script attempts to make them configurable to avoid blocking speed changes.
  - Speed settings are now persisted per-site (hostname) in localStorage.
  - You can suppress page pause behavior tied to visibility: open DevTools console and run `timer.suppressVisibility()`.
  - A `destroy()` cleanup is registered on page unload to remove listeners/observers.

## Changelog

- 1.5.0 (2025-11-01)
  - New compact vertical UI (theme-aware, accessible, touch-friendly)
  - Configurable shortcuts; per-origin persistence with optional tab sync
  - Safer hooks, Shadow DOM and iframe best-effort support
  - CSP/sandbox detection and friendly fallbacks (no bypassing protections)
  - Namespaced globals under `window.__TimerHooker__`
  - Welcome bubble and site exclude toggle
  
 - 
## How to install

- You will need a userscript manager extension such as Tampermonkey or Violentmonkey to install and run this script.
- If you already have one installed, open the install link below.
  (I already have a user script manager, let me install it!) https://greasyfork.org/en/scripts/553657-timerhooker-2026

- **Tampermonkey**
  - Chrome Web Store: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo

- **Violentmonkey**
  - Chrome Web Store: https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag

- **Update URL**
  - https://update.greasyfork.org/scripts/553657/TimerHooker%202026.user.js

- **Script install page**
  - https://greasyfork.org/en/scripts/553657-timerhooker-2026

### Tampermonkey A209 (Chrome/Edge 138+)

For Tampermonkey v5.3+ on Chromium-based browsers, you must enable either the "Allow User Scripts" toggle (Chrome/Edge 138+) or Developer Mode. This is required in addition to the `userScripts` permission so that the browser shows a clear warning and you explicitly allow userscript execution.

- Why is this required?
  - Userscripts need both the `userScripts` permission and either the Allow User Scripts toggle or Developer Mode enabled. The extra step is a browser safeguard to ensure informed consent for running userscripts.

- Steps to enable
  - In desktop Chrome/Edge 138+:
    - Right-click the Tampermonkey icon → Manage Extension.
    - Enable the "Allow User Scripts" toggle.
  - Or enable Developer Mode:
    - Go to `chrome://extensions` or `edge://extensions`.
    - Turn on Developer mode (top right).
  
Please enable developer mode to allow userscript injection. Click here for more info how to do this.
https://www.tampermonkey.net/faq.php#Q209

Note: When enabling "Allow user scripts", the extension can run code not reviewed by Google. Only enable this if you trust the source and understand the risks.

## Quick Start

- Install the matching userscript extension for your browser (Tampermonkey/Violentmonkey).
- Install TimerHooker from GreasyFork: `https://greasyfork.org/en/scripts/553657-timerhooker-2026`
- After installation, open any website. A compact pill appears on the left. Click to adjust speed.
- The badge shows the current multiplier; controls allow exact input and quick actions.

## Shortcut keys

- Alt + Shift + ArrowUp: Increase (default +2)
- Alt + Shift + ArrowDown: Decrease (default -2)
- Ctrl + Alt + =: Multiply (×2)
- Ctrl + Alt + -: Divide (÷2)
- Ctrl + Alt + 0: Reset to 1×
- Ctrl + Alt + 9: Prompt custom speed

You can change these in the UI settings panel.

## Persistence & Sync

- Multiplier is saved in `localStorage` per origin (hostname).
- Optional “Sync tabs” toggle uses the `storage` event to propagate changes across tabs/windows.
- “Send iframes” toggles whether same-origin iframes receive updates via `postMessage`.

## Compatibility & Fallbacks

- Hooks `setTimeout`, `setInterval`, and `Date` using Everything-Hook with a watchdog to reapply if sites reassign them.
- Shadow DOM: observes `attachShadow` and applies rates to media elements inside shadow roots.
- Iframes: best-effort messaging to same-origin frames; for cross-origin/sandboxed frames, a small non-invasive parent hint is shown.
- CSP/sandbox: the script will not bypass protections. If style/UI injection is blocked, a friendly message is shown.
- Media: adjusts `<video>/<audio>` `playbackRate`. If blocked by site/DRM, a tooltip explains that changes are prevented.

## Known limitations

- Cross-origin iframes cannot be controlled.
- DRM-protected or heavily obfuscated players may ignore `playbackRate` and cannot be altered safely.
- Strict CSP or sandboxed contexts may block UI/style injection. The script will not attempt to bypass.

## Security & Ethics

- This script will NOT attempt to bypass site protections, remove paywalls, disable DRM, or break site security.
- If injection fails because of site restrictions, the script informs you and offers to exclude/include the current domain.

## Test plan (quick)

- Browsers: Chrome (stable), Firefox (stable), Edge; Safari where userscripts are allowed.
- Sites:
  - YouTube (SPA): UI appears; changing multiplier adjusts timers and video playback; survives navigation.
  - Vimeo: media playbackRate follows the multiplier.
  - Twitter/X, Facebook: UI appears; timers adjust (e.g., setTimeout behavior) without errors.
  - News sites with CSP: If style injection is blocked, a friendly message is shown; no bypass attempts.
  - Banking portals: By default, exclude domain in UI if unwanted; script must not break the page.
  - Pages with heavy anti-tamper: No uncaught exceptions; watchdog re-applies hooks if safe.

Edge cases expected behavior:
- CSP-blocked injection: Show "Injection blocked by site (CSP / sandbox)." message. No bypass.
- Cross-origin iframe: Parent shows a small "iframe blocked by site" hint; no control applied inside.
- playbackRate sealed: Media shows tooltip "Paused: site prevented playback changes"; multiplier still affects timers.

## Limitations / Next

- Some sites rely on `requestAnimationFrame` for timing. Hooking rAF is planned to better align visual timelines with the chosen speed.
- Consider adding a draggable UI and a per-site allow/deny toggle in a future update.
