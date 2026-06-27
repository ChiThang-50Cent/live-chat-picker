# Live Chat Picker

> 🇻🇳 [Tiếng Việt](#tiếng-việt) · 🇬🇧 [English](#english)

---

## Tiếng Việt

### Giới thiệu

**Live Chat Picker** là extension Chrome (Manifest V3) giúp **lọc tin nhắn trong
livestream YouTube theo từ khoá** rồi xuất danh sách **tên người chat** để dán
thẳng vào trang quay số [wheelofnames.com](https://wheelofnames.com) — dùng cho
minigame giveaway.

Extension đọc DOM live chat trực tiếp, **không dùng YouTube Data API**, không cần
đăng nhập hay OAuth.

### Cách cài đặt

1. Tải file `live-chat-picker-v1.0.0.zip` từ repo này về máy (nút **Download**
   trên GitHub).
2. **Giải nén** file `.zip` ra một thư mục bất kỳ (vd `live-chat-picker`).
3. Mở `chrome://extensions`.
4. Bật **Developer mode** (góc trên phải).
5. Bấm **Load unpacked** → chọn thư mục vừa giải nén (thư mục chứa
   `manifest.json` ở cấp gốc).
6. Mở trang livestream YouTube (hoặc cửa sổ popout chat
   `youtube.com/live_chat?v=...`).

### Cách dùng

Một icon **phễu (filter)** sẽ xuất hiện trong thanh tiêu đề của khung chat
(nằm cạnh các nút mặc định của YouTube, cùng hàng với "Người hâm mộ hàng đầu").

![Vị trí icon filter trong thanh header của live chat](images/header-filter-icon.png)

1. **Bấm vào icon phễu** → mở bảng điều khiển **Live Chat Picker**.
2. Gõ **từ khoá** vào ô keyword (vd: `em`). Việc lọc theo *contain*,
   không phân biệt HOA/thường — tin `"em đi không"`, `"anh em"`, `"system"` đều
   khớp nếu từ khoá là `em`.
3. Khi host **công bố bắt đầu** minigame → bấm nút **▶ Start** (nút xanh).
   Icon phễu ở header sẽ **đổi sang màu đỏ** để báo đang thu thập.
4. Khi host **kết thúc** → bấm **■ Stop** (nút đổi sang đỏ).
5. Bấm **📋 Copy list** → danh sách tên (mỗi tên một dòng) được copy vào
   clipboard.
6. Sang [wheelofnames.com](https://wheelofnames.com) → paste vào ô nhập tên
   → bấm quay.

![Bảng Live Chat Picker đang chạy: đã thu thập 64 tin, khớp 8, 5 tên unique](images/panel-running.png)

### Các thành phần trên bảng điều khiển

| Thành phần | Ý nghĩa |
|---|---|
| **▶ Start / ■ Stop** | Bắt đầu / dừng thu thập. Chỉ tin nhắn đến *trong lúc đang Start* mới được lưu. |
| **Keyword** | Từ khoá lọc, không phân biệt hoa thường, so khớp trong nội dung tin (contain). Ô rỗng = không khớp gì cả. |
| **Collected / Matched / Unique** | Tổng tin đã thu / số tin khớp từ khoá / số tên (đã gộp trùng) duy nhất. |
| **Copy list** | Sao chép danh sách tên (mỗi tên 1 dòng). |
| **Clear** | Xoá dữ liệu đã thu thập. tin đã xử lý trước đó *không* được thêm lại. |
| **Danh sách** | Cuộn tự động xuống cuối khi có tên mới; nếu bạn đang cuộn lên xem tên cũ thì sẽ không bị giật xuống. |

### Lưu ý

- Tin nhắn đến **trước** khi bấm Start (hoặc sau khi reload trang) **không** được
  hồi lại — hãy bấm Start đúng lúc host công bố.
- Tên người gửi được tự động **gộp trùng** (phân biệt theo lowercase, bỏ tiền tố
  `@`) → một user comment nhiều lần vẫn chỉ tính 1 tên.
- Emoji / huy hiệu không được lấy (chỉ lấy text nội dung).
- Tin Super Chat / membership vẫn được đếm nếu có tên + nội dung.
- Cấu hình từ khoá được lưu vào `localStorage` của trình duyệt, nhớ lại khi mở lại.

---

## English

### Overview

**Live Chat Picker** is a Chrome extension (Manifest V3) that **filters messages
in a YouTube livestream by keyword** and exports the list of participant
**display names**, ready to paste into [wheelofnames.com](https://wheelofnames.com)
for giveaways / minigames.

It reads the live chat DOM directly — **no YouTube Data API, no login, no OAuth**.

### Install

1. Download `live-chat-picker-v1.0.0.zip` from this repo (the **Download**
   button on GitHub).
2. **Unzip** the `.zip` to any folder (e.g. `live-chat-picker`).
3. Open `chrome://extensions`.
4. Enable **Developer mode** (top right).
5. Click **Load unpacked** → select the unzipped folder (the one containing
   `manifest.json` at its root).
6. Open a YouTube livestream (or the popout chat window
   `youtube.com/live_chat?v=...`).

### Usage

A **filter (funnel) icon** appears in the live chat header, next to YouTube's
default controls (same row as "Top fan" badge).

![Filter icon location in the live chat header](images/header-filter-icon.png)

1. **Click the filter icon** to open the **Live Chat Picker** panel.
2. Type a **keyword** (e.g. `em`). Matching is *contains*, case-insensitive —
   `"em đi không"`, `"anh em"`, `"system"` all match if the keyword is `em`.
3. When the host **starts** the giveaway → click **▶ Start** (green).
   The header filter icon turns **red** to indicate live collecting.
4. When the host **ends** → click **■ Stop** (turns red).
5. Click **📋 Copy list** to copy the list of names (one per line) to clipboard.
6. Go to [wheelofnames.com](https://wheelofnames.com) → paste into the entry
   box → spin.

![Live Chat Picker panel running: 64 collected, 8 matched, 5 unique names](images/panel-running.png)

### Panel reference

| Element | Meaning |
|---|---|
| **▶ Start / ■ Stop** | Start / stop collecting. Only messages arriving *while Start is on* are saved. |
| **Keyword** | Filter keyword (case-insensitive, contained in message). Empty = no matches. |
| **Collected / Matched / Unique** | Total collected / matched keyword / unique names (deduped). |
| **Copy list** | Copy the name list (one per line) to clipboard. |
| **Clear** | Wipe collected data. Already-processed messages are *not* re-collected. |
| **List** | Auto-scrolls to bottom when new names arrive; if you scroll up to read older names, it won't yank you back down. |

### Notes

- Messages that arrived **before** you pressed Start (or after a page reload)
  cannot be recovered — press Start right when the host announces.
- Author names are **auto-deduped** (case-insensitive, `@` prefix stripped) —
  a user commenting multiple times still counts as one name.
- Emoji / badges are not captured (text content only).
- Super Chat / membership messages still count if they have author + content.
- The keyword is saved to browser `localStorage` and remembered on reopen.

---

## Files

- `manifest.json` — Manifest V3 declaration; content script on
  `youtube.com/watch`, `/live`, `/live_chat` and `music.youtube.com/watch`.
- `content.js` — All logic + UI (Shadow DOM panel, header injection).
- `images/` — Screenshots used in this README.