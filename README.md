 # TimerHooker 2026

 - **Description**
   Control page timer speed. Speed up to skip page timing ads. Video fast forward/slow play. Skip ads. Supports almost all web pages.

 - **Install**
   - GreasyFork auto-update URL: https://update.greasyfork.org/scripts/553657/TimerHooker%202026.user.js
   - Install via Tampermonkey/Greasemonkey by visiting the URL above.

 - **Usage**
   - A small semicircle UI appears on the left. Click to increase/decrease/reset speed or enter a custom rate.
   - Keyboard shortcuts:
     - Ctrl + = or . → increase (step +2)
     - Alt + = or . → multiply (×2)
     - Ctrl + - or , → decrease (step -2)
     - Alt + - or , → divide (÷2)
     

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
- Install TimerHooker from GreasyFork: https://greasyfork.org/en/scripts/553657-timerhooker-2026
- After installation, open any website. A floating “energy ball” appears on the left. Hover to reveal acceleration options.
- Click to speed up or slow down. The floating badge shows the current multiplier.

## Shortcut keys

- Ctrl + = or Ctrl + > : Increase timer speed (default +2)
- Alt + = or Alt + > : Increase by multiples (default ×2)
- Ctrl + - or Ctrl + < : Decrease timer speed (default -2)
- Alt + - or Alt + < : Decrease by multiples (default ÷2)
- Ctrl + 0 or Alt + 0 : Reset to 1×
- Ctrl + 9 or Alt + 9 : Open custom speed input
