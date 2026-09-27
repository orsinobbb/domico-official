# 豆米口形象官網與免費部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成豆米口正式形象官網、發布至 GitHub Pages，並以 Cloudflare Tunnel 提供兩個獨立的本機服務子網域。

**Architecture:** 主站保持純靜態並由 GitHub Pages 提供；本機4173與3001透過同一條既有 Cloudflare Tunnel 分流。舊 GitHub Pages 儲存庫保留，只移轉自訂網域。

**Tech Stack:** HTML5、CSS、原生 ES modules、Node.js test runner、GitHub Pages、Cloudflare Tunnel、macOS LaunchAgent

**Spec:** `docs/superpowers/specs/2026-09-27-domico-official-site-design.md`

## Global Constraints

- 公開品牌為「豆米口 DOMICO」，文創支線為「DOMICO STUDIO」。
- 官網必須在家中電腦離線時仍可瀏覽。
- 商品僅為概念展示，不新增價格、結帳或假會員流程。
- 不在前端或 Git 儲存庫放入任何憑證與密鑰。
- 舊 GitHub 儲存庫內容不得刪除。

## Review Focus

- GitHub Pages 專案預覽與自訂網域下的相對資源路徑都能載入。
- 未載入圖片時仍保有可理解的替代文字與版面。
- JavaScript 或 localStorage 不可用時，核心內容仍可閱讀。
- 手機窄螢幕不產生水平溢出或遮住主要操作。
- Tunnel 設定不包含憑證內容，且未知 hostname 回傳404。

---

### Task 1: 固定正式站內容與部署契約

**Files:**
- Modify: `index.html`
- Create: `manifest.webmanifest`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `.nojekyll`
- Create: `CNAME`
- Test: `test/site.test.js`

**Interfaces:**
- Consumes: 現有靜態頁面與相對資源。
- Produces: 可由任意靜態伺服器發布的正式站根目錄。

- [ ] 寫入會檢查正式品牌、canonical、分享資訊、manifest、CNAME 與相對資源的失敗測試。
- [ ] 執行 `npm test`，確認新測試因部署中繼資料缺少而失敗。
- [ ] 在 `index.html` 補齊品牌、SEO、分享與品牌說明區，建立部署檔案。
- [ ] 執行 `npm test`，確認完整測試套件通過。

### Task 2: 完成響應式視覺與互動品質

**Files:**
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/state.js`
- Test: `test/state.test.js`

**Interfaces:**
- Consumes: 現有角色、心情、漫畫、商品資料與 localStorage 狀態。
- Produces: 可鍵盤操作、尊重減少動態偏好、具清楚下一步提示的互動頁面。

- [ ] 針對新增品牌導覽與 CTA 狀態寫入失敗測試。
- [ ] 執行 `npm test`，確認測試因行為尚未實作而失敗。
- [ ] 實作最小必要互動與樣式，保持既有內容結構。
- [ ] 執行 `npm test` 並以桌面與手機瀏覽器檢查主要流程。

### Task 3: 建立並驗證 GitHub Pages

**Files:**
- Modify: `.git/config`（透過 Git 指令）
- External: `orsinobbb/domico-official`

**Interfaces:**
- Consumes: Task 1、Task 2 的靜態站根目錄。
- Produces: GitHub Pages 預覽網址與正式自訂網域。

- [ ] 建立公開儲存庫並推送 `main`，不包含暫存檔或機密。
- [ ] 啟用 GitHub Pages main/root，先用 Pages 網址驗證完整資源。
- [ ] 從舊 Pages 設定移除自訂網域，再將 `domicotaiwan.com` 指向新站。
- [ ] 驗證 apex、www、HTTPS、主要圖片與互動腳本。

### Task 4: 建立 Cloudflare Tunnel 分流

**Files:**
- Create: `~/.cloudflared/config.yml`
- Create: `~/Library/LaunchAgents/com.cloudflare.domico-tunnel.plist`

**Interfaces:**
- Consumes: 既有 Tunnel `my-home-server`、本機4173與3001服務。
- Produces: `studio.domicotaiwan.com` 與 `gateway.domicotaiwan.com`。

- [ ] 先驗證4173、3001與現有 Tunnel 憑證可用。
- [ ] 寫入不含密鑰的 ingress 設定並執行 `cloudflared tunnel ingress validate`。
- [ ] 建立兩筆 Tunnel DNS route，啟動 KeepAlive LaunchAgent。
- [ ] 從外部 HTTPS 驗證兩個 hostname，並測試終止程序後會自動恢復。

### Task 5: 最終驗收與交付

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: 已發布主站與已啟動 Tunnel。
- Produces: 維護、更新與故障排查說明。

- [ ] 記錄本機預覽、測試、發布、Tunnel 與回復舊站的方法。
- [ ] 執行完整單元測試與HTTP資源檢查。
- [ ] 以手機與桌面完成角色、漫畫、商品篩選與收藏流程。
- [ ] 確認 GitHub Pages 與兩個 Tunnel 子網域最終狀態。

