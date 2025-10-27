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
     - Ctrl/Alt + 0 → reset to 1×

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
