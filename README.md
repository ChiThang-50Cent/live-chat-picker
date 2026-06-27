# Live Chat Picker

Chrome extension (Manifest V3) — pick chat participants from a YouTube live
stream by keyword, then paste the name list into
[wheelofnames.com](https://wheelofnames.com).

No YouTube Data API. Reads live chat DOM directly.

## Features
- Filter icon injected into the live chat header (always on) — turns red while collecting
- **Start / Stop** button — only messages arriving while live are collected
- Keyword filter (case-insensitive, contained in message content)
- Duplicate names merged automatically
- Live stats: collected / matched / unique
- **Copy list** (one name per line, paste straight into Wheel of Names)
- **Clear** to reset collected data
- Config saved to `localStorage`

## Install (developer mode)
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → select the `yt-giveaway-ext` folder
4. Open a YouTube livestream (or the popout chat `youtube.com/live_chat?v=...`)
5. The filter icon appears in the live chat header — click to open the panel

## Usage
1. Open the livestream.
2. Open the panel, set the keyword (e.g. `em`).
3. Press **Start** when the host announces the giveaway.
4. Press **Stop** when the giveaway window closes.
5. Press **Copy list** and paste into wheelofnames.com.

## Notes / limits
- Only messages arriving while **Start** is active are collected. Messages
  before pressing Start (or after reload) cannot be recovered.
- Emoji/badges are not captured (text content only).
- Paid/superchat/membership messages still count if they have author + content.
- If YouTube changes its chat DOM and collection stops working, inspect
  `yt-live-chat-text-message-renderer` in DevTools and adjust selectors.

## Files
- `manifest.json` — MV3 declaration, content script on `watch`/`live`/`live_chat`
- `content.js` — all logic + UI (Shadow DOM)