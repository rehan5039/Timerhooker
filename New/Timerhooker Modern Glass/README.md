# Timerhooker (Modern Glass UI)

Compact floating controller to speed up or slow down page timers and videos. Adds:

- Default speed persistence
- Controller panel with quick actions
- Long-press to set default
- Double-click to open panel
- Keyboard shortcuts

## How to Use

- Single-click round button
  - Toggle Normal (x1) ↔ Default Fast (your saved speed)
- Double-click round button
  - Open/Close controller panel next to the button
- Drag the button
  - Reposition anywhere on screen. It auto-hides half off-screen after a few seconds of inactivity.
- Long-press on the button (hold ~0.7s desktop / ~0.8s touch)
  - Set current speed as the new default. A small toast shows “Default xN”.

## Controller Panel

Opens on double-click. Buttons:

- −: Decrease by 0.25
- +: Increase by 0.25
- 1/2: Half the speed
- ×2: Double the speed
- Reset: Back to x1
- Save: Save current speed as default

The top label shows current speed: “Speed: xN.NN”.

## Keyboard Shortcuts

Shortcuts are ignored while typing in inputs/textareas.

- Ctrl/Cmd + =: Increase speed by 0.25
- Ctrl/Cmd + -: Decrease speed by 0.25
- Alt + =: Double speed (×2)
- Alt + -: Halve speed (×0.5)
- Ctrl/Cmd + 0: Reset to x1
- Ctrl/Cmd + D: Save current speed as default
- Ctrl/Cmd + S: Toggle controller panel

Note: Some sites may intercept these keys (e.g., Ctrl+S). If a shortcut conflicts, use the controller panel instead.

## Defaults & Persistence

- Default fast speed is stored in your browser’s localStorage as `tm_default_speed`.
- Range clamped to 0.10 – 64.00
- Single-click toggle uses this default speed.

## What Gets Sped Up

- Timers: `setTimeout` and `setInterval` are accelerated/slowdown globally using the chosen speed.
- Video: All `<video>` elements (including inside shadow roots) get `playbackRate = speed`.

## Tips (Hinglish)

- Button ko hold/long-press karke current speed ko default banao.
- Do baar click (double-click) se controller khul jaata hai.
- Single click se Normal aur Default Fast ke beech toggle hota hai.
- Keyboard shortcuts se jaldi se speed badhao/ghatao.

## Troubleshooting

- Panel nahi khul raha: Page reload karke dekho. Kuch sites JS events ko block karti hain.
- Shortcuts kaam nahi kar rahe: Ho sakta hai site khud hi Ctrl/Cmd keys use kar rahi ho. Tab controller buttons use karo.
- Video speed apply nahi ho rahi: Kuch custom players playbackRate ko override karte hain. Page reload ya site-specific conflicts ho sakte hain.

## License

MIT
