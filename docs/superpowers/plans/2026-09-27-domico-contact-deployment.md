# 豆米口聯絡串接與免費部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以免費方案完成科技站 GitHub Pages、自訂網域、品牌 Email、單一 LINE 官方帳號及 Google 預約，並將可用入口安全接回官網。

**Architecture:** 正式網站只依賴 GitHub Pages 與 Cloudflare DNS；Cloudflare Email Routing 將品牌信箱轉寄 Gmail，LINE 與 Google Calendar 保持外部託管。所有外部網址先經實際可達驗證才寫入前端設定，缺少任一服務時網站自動使用 Email 備援。

**Tech Stack:** GitHub Pages、Cloudflare DNS／Email Routing／Tunnel、LINE Official Account Manager、Google Calendar Appointment Schedule、原生 ES modules

**Spec:** `docs/superpowers/specs/2026-09-27-domico-brand-ecosystem-design.md`

## Global Constraints

- 科技站公開儲存庫為 `orsinobbb/domico-tech`，正式網域為 `tech.domicotaiwan.com`。
- `hello@domicotaiwan.com` 免費轉寄至 `domicotaiwan@gmail.com`，不自架郵件伺服器。
- LINE 建立單一官方帳號「豆米口 DOMICO」；Developers Console 不用來取代 Official Account Manager。
- Google 預約名稱為「30 分鐘需求對焦」；週一至週五 10:00–17:00 Asia/Taipei、提前 24 小時、前後 15 分鐘、每日最多兩場、啟用衝突保護。
- `studio.domicotaiwan.com → 4173` 與 `gateway.domicotaiwan.com → 3001` 可繼續並存，但 `tech` 不經 Tunnel。
- 憑證、token、登入 cookie 與個人行事曆內容不得進入 Git 或前端。
- 任何需要授權、建立外部帳號或 DNS／Email 規則變更的最後動作，必須在操作當下清楚確認目標與影響。

## Review Focus

- Cloudflare DNS 不得讓 `tech` 同時指向 Tunnel 與 GitHub Pages；Task 2 的 DNS 查詢覆蓋。
- Email Routing 啟用所需 MX/TXT 不得破壞既有郵件設定，轉寄須以實收而非控制台狀態驗收；Task 3 覆蓋。
- LINE 或 Google 網址未建立、為後台網址或需要管理員登入時，不得發布成訪客 CTA；Task 4、5 覆蓋。
- 帶摘要的 `mailto:` 不得因 `#`、`&`、換行或中文破壞 URL；Task 6 的既有單元測試覆蓋。
- 居家電腦、4173、3001 或 Tunnel 離線時，兩個正式站仍須可瀏覽；Task 7 的外部 HTTP 驗收覆蓋。

---

### Task 1: 建立科技站 GitHub 儲存庫與 Pages 預覽

**Files:**
- Create: `../豆米口科技官網/.gitignore`
- Create: `../豆米口科技官網/.nojekyll`
- Modify: `../豆米口科技官網/README.md`
- External: `https://github.com/orsinobbb/domico-tech`

**Interfaces:**
- Consumes: 科技站計畫的已測試候選版本。
- Produces: `main` 分支與可公開存取的 GitHub Pages 專案網址。

- [ ] **Step 1: 檢查待發布內容與機密**

  Run: `cd ../豆米口科技官網 && git status --short && rg -n "token|secret|BEGIN.*PRIVATE|cloudflared|gmail\.com" -g '!README.md' .`
  Expected: 除公開轉寄目的說明外，無憑證或 token。

- [ ] **Step 2: 建立公開儲存庫、設定 origin 並推送 main**

  建立前先確認登入帳號為 `orsinobbb`、儲存庫名稱精確為 `domico-tech` 且不覆蓋同名既有儲存庫；啟用 Pages `main / root`。

- [ ] **Step 3: 驗證 Pages 專案網址與相對資源**

  以 HTTP 檢查首頁、CSS、JS、五張角色圖、manifest 與 404 均回應成功；在瀏覽器完成一次健檢。

- [ ] **Step 4: 記錄預覽網址並提交部署說明**

  Run: `git add .gitignore .nojekyll README.md && git commit -m "docs: document GitHub Pages deployment" && git push origin main`

### Task 2: 將 tech 子網域直接接到 GitHub Pages

**Files:**
- Create: `../豆米口科技官網/CNAME`
- Modify: `../豆米口科技官網/test/site.test.js`
- External: Cloudflare DNS、GitHub Pages custom domain

**Interfaces:**
- Consumes: Task 1 的 Pages 網址。
- Produces: `https://tech.domicotaiwan.com/`，不經 Cloudflare Tunnel。

- [ ] **Step 1: 寫入 CNAME 失敗測試**

  斷言 `CNAME` 精確為 `tech.domicotaiwan.com`，canonical、Open Graph、sitemap 與 robots 皆使用相同 HTTPS origin。

- [ ] **Step 2: 加入 CNAME、執行測試並推送**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS。

- [ ] **Step 3: 檢查既有 DNS 後建立唯一的 tech CNAME**

  先列出 `tech`、`studio`、`gateway` 記錄；只新增／更新 `tech → orsinobbb.github.io`，不得改動兩個 Tunnel host。待 GitHub 顯示 DNS check 成功後啟用 HTTPS。

- [ ] **Step 4: 驗證解析、憑證與來源**

  Run: `dig +short tech.domicotaiwan.com && curl -I https://tech.domicotaiwan.com/`
  Expected: DNS 指向 Pages、HTTP 200、有效 HTTPS；關閉本機預覽後仍正常。

- [ ] **Step 5: 提交並推送自訂網域**

  Run: `git add CNAME test/site.test.js && git commit -m "feat: publish DOMICO Labs domain" && git push origin main`

### Task 3: 啟用品牌 Email Routing 並實收驗證

**Files:**
- External: Cloudflare Email Routing for `domicotaiwan.com`
- External: Gmail `domicotaiwan@gmail.com`

**Interfaces:**
- Consumes: 已由使用者掌控的 Cloudflare zone 與 Gmail 收件匣。
- Produces: 可收信的 `hello@domicotaiwan.com`。

- [ ] **Step 1: 只讀檢查現有 MX、SPF 與 Email Routing 狀態**

  若已有郵件供應商，先停止並回報衝突；不得直接覆蓋既有 MX。

- [ ] **Step 2: 建立目的地址並完成 Gmail 驗證**

  目的地址精確為 `domicotaiwan@gmail.com`；驗證連結只在確認寄件來源與 Cloudflare zone 後使用。

- [ ] **Step 3: 建立 `hello` 路由並啟用必要 DNS 記錄**

  只建立 `hello@domicotaiwan.com → domicotaiwan@gmail.com`，不建立 catch-all。

- [ ] **Step 4: 從外部信箱寄送唯一測試主旨並驗證實收**

  Expected: Gmail 收到收件人為品牌地址的測試信；回覆寄件身份仍由 Gmail 管理，不宣稱已完成網域寄件。

### Task 4: 建立單一 LINE 官方帳號與公開加好友入口

**Files:**
- External: LINE Official Account Manager
- External: LINE Developers Console（只供後續 Messaging API）

**Interfaces:**
- Consumes: 品牌名稱、分類與五個歡迎分流。
- Produces: 可公開存取的 LINE 加好友網址與官方帳號 Basic ID。

- [ ] **Step 1: 檢查是否已有同名官方帳號**

  在 Official Account Manager 而非 Developers Console 搜尋；若存在則停止建立，避免重複帳號。

- [ ] **Step 2: 建立「豆米口 DOMICO」官方帳號**

  建立前確認帳號名稱、國家／地區與業務分類；不在此階段啟用 Messaging API 或自動蒐集資料。

- [ ] **Step 3: 設定基本資料、歡迎訊息與圖文選單資訊架構**

  五個入口為角色故事、商品活動、親子教育、科技諮詢、預約對談；未準備好的入口導向現有頁面或 Email，不做失效連結。

- [ ] **Step 4: 取得訪客用加好友網址並以登出／無管理權限狀態驗證**

  Expected: 公開頁顯示正確品牌名稱，可進入加好友流程，不是管理後台 URL。

### Task 5: 建立 Google「30 分鐘需求對焦」預約頁

**Files:**
- External: Google Calendar Appointment Schedule

**Interfaces:**
- Consumes: 使用者的 Google Calendar 與規格時段。
- Produces: 可公開預約、會避開忙碌時間的 booking URL。

- [ ] **Step 1: 選擇承載預約的主要行事曆並只讀檢查時區**

  時區必須為 Asia/Taipei；不讀取或公開既有活動內容，只使用忙碌衝突判定。

- [ ] **Step 2: 建立指定預約規則**

  名稱「30 分鐘需求對焦」、週一至週五 10:00–17:00、提前 24 小時、前後 15 分鐘、每日最多兩場，啟用衝突保護；說明欄列出適合對象與預約前準備資料。

- [ ] **Step 3: 取得公開 booking URL 並以訪客狀態驗證**

  Expected: 顯示台北時區／訪客當地時區提示、已忙時段不可選、沒有公開私人活動內容。

### Task 6: 把已驗證的 LINE、預約與 Email 接回科技站

**Files:**
- Modify: `../豆米口科技官網/src/config.js`
- Modify: `../豆米口科技官網/test/contact.test.js`
- Modify: `../豆米口科技官網/README.md`

**Interfaces:**
- Consumes: Task 3–5 實際驗證過的公開網址。
- Produces: 依需求健檢結果顯示的三種可用聯絡 CTA。

- [ ] **Step 1: 將正式 URL 寫入測試 fixture 並覆蓋 Unicode 摘要**

  測試包含中文、換行、`#`、`&`，解析產生的 `mailto:` 後內容必須完全還原；LINE 與 booking 必須為 HTTPS 公開網址。

- [ ] **Step 2: 更新 config 並執行完整測試**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS。

- [ ] **Step 3: 以三條代表路徑完成瀏覽器驗收**

  低意向顯示 LINE、明確專案顯示 Google 預約、附件／提案顯示 Email；每條路徑保留可複製摘要且不要求重新填寫。

- [ ] **Step 4: 提交並發布整合**

  Run: `git add src/config.js test/contact.test.js README.md && git commit -m "feat: connect verified contact channels" && git push origin main`

### Task 7: 驗證雙正式站、Tunnel 並留下故障切換說明

**Files:**
- Modify: `../豆米口科技官網/README.md`
- Modify: `README.md`
- External: `domicotaiwan.com`、`tech.domicotaiwan.com`、`studio.domicotaiwan.com`、`gateway.domicotaiwan.com`

**Interfaces:**
- Consumes: 已發布雙站與既有 Tunnel 配置。
- Produces: 可重複的發布／故障排查步驟與最終驗收證據。

- [ ] **Step 1: 執行正式資源矩陣檢查**

  檢查 apex、www、tech 的首頁、CSS、JS、分享圖與主要角色圖；`studio`、`gateway` 分別檢查預期來源，未知 Tunnel hostname 回 404。

- [ ] **Step 2: 模擬本機服務離線**

  暫停本機預覽而不刪除設定，確認 apex、www、tech 仍正常；再恢復本機服務並確認 Tunnel host 回復。

- [ ] **Step 3: 記錄故障降級與更新流程**

  說明 LINE／預約暫停時清空 config 即回到 Email、Tunnel 故障不影響正式站、Email Routing 故障的檢查順序。

- [ ] **Step 4: 執行兩個儲存庫測試並提交文件**

  Run: `npm test && (cd ../豆米口科技官網 && npm test)`
  Expected: 兩套測試皆 PASS。
