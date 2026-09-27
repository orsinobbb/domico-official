# 豆米口科技形象官網 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可獨立發布的豆米口科技形象官網，以小米五種任務角色、六類服務及匿名需求健檢，把訪客引導到適合的下一步。

**Architecture:** 在相鄰目錄建立獨立的純靜態專案 `豆米口科技官網`，內容在無 JavaScript 時仍完整可讀；互動只由原生 ES modules 增強。需求健檢、草稿保存、摘要及聯絡分流拆成無 DOM 的狀態模組，由 Node.js 內建測試執行器驗證。

**Tech Stack:** HTML5、CSS、原生 ES modules、Node.js test runner、localStorage、ImageGen 角色圖

**Spec:** `docs/superpowers/specs/2026-09-27-domico-brand-ecosystem-design.md`

## Global Constraints

- 品牌名稱使用「豆米口科技 DOMICO LABS」，首頁承諾為「把複雜的科技，變成團隊真的能使用的下一步」。
- 六類服務為顧問、軟體開發、AI 導入、黑客松、開班／企業內訓、團體／個人教練。
- 小米五種任務角色必須各有一張獨立生成、獨立檢查的圖片，不以同一張圖裁切冒充。
- 不捏造客戶、成果數據、見證或合作標誌；首版證據只使用可公開驗證的本專案交付物。
- 健檢與草稿資料預設只存在瀏覽器，不傳送到伺服器；無 localStorage 時仍可完成。
- 320px 以上不得水平溢位；支援鍵盤、可見焦點、語意標籤與 `prefers-reduced-motion`。
- 所有第一方資源使用相對路徑，科技正式站不依賴居家電腦或 Tunnel。

## Review Focus

- 健檢答案缺漏、順序不同或包含未知值時，不得崩潰或產生誤導結果；Task 2 的狀態測試覆蓋。
- localStorage 被封鎖、內容損壞或版本過期時，回到空白健檢但保留操作能力；Task 2 的儲存測試覆蓋。
- LINE 或 Google 預約網址為空或無效時，不渲染失效按鈕並自動回到 Email；Task 3 的聯絡路由測試覆蓋。
- JavaScript 載入失敗時，六類服務、方法、限制及 Email 仍可閱讀與操作；Task 1 的靜態契約測試覆蓋。
- 320px、鍵盤與減少動態環境仍能完成健檢並取得摘要；Task 4、Task 5 的瀏覽器驗收覆蓋。

---

### Task 1: 建立無 JavaScript 也完整的品牌與服務骨架

**Files:**
- Create: `../豆米口科技官網/package.json`
- Create: `../豆米口科技官網/index.html`
- Create: `../豆米口科技官網/styles.css`
- Create: `../豆米口科技官網/manifest.webmanifest`
- Create: `../豆米口科技官網/robots.txt`
- Create: `../豆米口科技官網/sitemap.xml`
- Create: `../豆米口科技官網/404.html`
- Create: `../豆米口科技官網/test/site.test.js`

**Interfaces:**
- Consumes: 規格第 5、6、9、10 節的品牌、服務、SEO 與降級要求。
- Produces: 可直接由靜態伺服器開啟的語意 HTML 根頁與部署契約。

- [ ] **Step 1: 寫入失敗的靜態契約測試**

  在 `test/site.test.js` 斷言標題與 canonical 使用 `https://tech.domicotaiwan.com/`、六個服務 ID 與五個角色 ID 均存在、Email 備援為 `hello@domicotaiwan.com`、manifest／robots／sitemap／404 齊全，且第一方 `src`/`href` 均非根相對路徑。

- [ ] **Step 2: 執行測試並確認因檔案尚未建立而失敗**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: FAIL，指出 `index.html` 或部署檔案不存在。

- [ ] **Step 3: 建立靜態內容與部署檔案**

  `index.html` 依序包含首頁承諾、五個情境入口、六類服務、五階段方法、可驗證示範交付物、關於我們、需求健檢區與 Email 聯絡區；`<noscript>` 清楚說明仍可用 Email 聯絡。

- [ ] **Step 4: 執行測試並確認通過**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS。

- [ ] **Step 5: 初始化獨立儲存庫並提交可讀的靜態首版**

  Run: `git init -b main && git add package.json index.html styles.css manifest.webmanifest robots.txt sitemap.xml 404.html test/site.test.js && git commit -m "feat: establish DOMICO Labs static site"`

### Task 2: 實作需求健檢、推薦與安全草稿

**Files:**
- Create: `../豆米口科技官網/src/assessment.js`
- Create: `../豆米口科技官網/src/storage.js`
- Create: `../豆米口科技官網/test/assessment.test.js`
- Create: `../豆米口科技官網/test/storage.test.js`

**Interfaces:**
- Consumes: 六類服務 ID `consulting | software | ai | hackathon | training | coaching`。
- Produces: `QUESTIONS: readonly Question[]`、`createAssessmentState(): AssessmentState`、`answerQuestion(state, questionId, value): AssessmentState`、`getAssessmentProgress(state): {answered:number,total:number,complete:boolean}`、`scoreAssessment(state): AssessmentResult`、`buildRequirementSummary(state, result): string`、`loadAssessmentDraft(storage): AssessmentState`、`saveAssessmentDraft(storage, state): boolean`。

- [ ] **Step 1: 寫入健檢與 Review Focus 的失敗測試**

  測試六題完成度、AI／軟體／黑客松／訓練／教練／顧問的代表性答案路徑、答案順序不影響結果、缺漏與未知值回傳安全的「先釐清」結果，以及摘要包含目標、現況、阻礙、推薦路線和準備清單。

- [ ] **Step 2: 執行健檢測試並確認因匯出尚未定義而失敗**

  Run: `cd ../豆米口科技官網 && node --test test/assessment.test.js`
  Expected: FAIL，指出 `assessment.js` 或指定 export 不存在。

- [ ] **Step 3: 實作純狀態健檢函式**

  使用固定服務權重與可解釋的 tie-break 順序；`AssessmentResult` 必須提供 `primaryServiceId`、`secondaryServiceId | null`、`obstacle`、`firstStep`、`preparationItems` 與 `confidence: low | medium | high`。

- [ ] **Step 4: 執行健檢測試並確認通過**

  Run: `cd ../豆米口科技官網 && node --test test/assessment.test.js`
  Expected: PASS。

- [ ] **Step 5: 寫入儲存失敗測試**

  測試正常 round-trip、損壞 JSON、錯誤 schema 版本、`getItem`/`setItem` 丟出例外；失敗情境必須回傳空白狀態或 `false`，不得中斷健檢。

- [ ] **Step 6: 實作版本化、安全的草稿讀寫**

  固定 key `domico-labs-assessment-v1`，只保存已知 question ID 與值，不保存 Email、姓名或自由文字個資。

- [ ] **Step 7: 執行完整測試並提交**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS。
  Run: `git add src/assessment.js src/storage.js test/assessment.test.js test/storage.test.js && git commit -m "feat: add private needs assessment"`

### Task 3: 實作聯絡意圖分流與需求摘要

**Files:**
- Create: `../豆米口科技官網/src/contact.js`
- Create: `../豆米口科技官網/src/config.js`
- Create: `../豆米口科技官網/test/contact.test.js`

**Interfaces:**
- Consumes: Task 2 的 `AssessmentResult` 與 `buildRequirementSummary()`。
- Produces: `CONTACT_CONFIG`、`resolveContactRoute(result, config): "line" | "booking" | "email"`、`buildMailto(summary, serviceId, email): string`、`getAvailableContactActions(result, config): ContactAction[]`。

- [ ] **Step 1: 寫入聯絡分流失敗測試**

  斷言低信心／單一問題優先 LINE、高信心且明確專案優先預約、附件與正式提案優先 Email；LINE／booking URL 缺少或非 HTTPS 時完全不回傳該 action 並降級到 Email。`mailto:` 的收件人、主旨及摘要必須正確 URL encode。

- [ ] **Step 2: 執行測試並確認匯出缺少而失敗**

  Run: `cd ../豆米口科技官網 && node --test test/contact.test.js`
  Expected: FAIL。

- [ ] **Step 3: 實作聯絡配置與純分流函式**

  `CONTACT_CONFIG` 初始只啟用 `email: "hello@domicotaiwan.com"`；`lineUrl` 與 `bookingUrl` 保持空字串，直到整合計畫取得可驗證正式網址。

- [ ] **Step 4: 執行完整測試並提交**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS。
  Run: `git add src/contact.js src/config.js test/contact.test.js && git commit -m "feat: route inquiries by visitor intent"`

### Task 4: 將健檢接上無障礙互動頁面

**Files:**
- Create: `../豆米口科技官網/src/app.js`
- Modify: `../豆米口科技官網/index.html`
- Modify: `../豆米口科技官網/styles.css`
- Modify: `../豆米口科技官網/test/site.test.js`

**Interfaces:**
- Consumes: Task 2 的健檢／儲存 API與 Task 3 的聯絡 API。
- Produces: 可用鍵盤完成、可返回修改、可複製摘要的六題健檢 UI。

- [ ] **Step 1: 擴充靜態契約失敗測試**

  斷言健檢使用 `<form>`、題組使用 `<fieldset><legend>`、進度有文字與 `aria-live`、結果包含複製摘要及重新作答按鈕，外部聯絡區不以空網址建立 `<a>`。

- [ ] **Step 2: 執行測試確認新契約失敗**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: FAIL，指出健檢語意結構缺少。

- [ ] **Step 3: 實作 DOM 綁定與漸進增強**

  使用 event delegation；每次回答保存草稿、結果顯示推薦理由／不適合情境／低風險第一步／準備清單，複製 API 不可用時顯示可選取文字，不阻擋 Email。

- [ ] **Step 4: 執行測試並以鍵盤完成一次健檢**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS；Tab、Space、Enter 可完成全流程，焦點在換題與顯示結果後移到正確標題。

- [ ] **Step 5: 提交互動健檢**

  Run: `git add index.html styles.css src/app.js test/site.test.js && git commit -m "feat: guide visitors through needs assessment"`

### Task 5: 製作五張小米角色圖與數位工作桌視覺

**Files:**
- Create: `../豆米口科技官網/images/roles/xiaomi-detective.png`
- Create: `../豆米口科技官網/images/roles/xiaomi-architect.png`
- Create: `../豆米口科技官網/images/roles/xiaomi-ai-copilot.png`
- Create: `../豆米口科技官網/images/roles/xiaomi-captain.png`
- Create: `../豆米口科技官網/images/roles/xiaomi-coach.png`
- Modify: `../豆米口科技官網/index.html`
- Modify: `../豆米口科技官網/styles.css`
- Modify: `../豆米口科技官網/test/site.test.js`

**Interfaces:**
- Consumes: 主站現有小米造型作為一致性參考，使用 ImageGen 技能逐張生成。
- Produces: 五張個別可辨識、同一角色世界觀、具描述性 alt 的任務角色圖。

- [ ] **Step 1: 寫入圖片契約失敗測試**

  斷言五個獨立檔案皆存在、非空，HTML 各引用一次並具有描述角色與任務的繁體中文 alt；不得以 CSS sprite 或同檔 query string 假裝不同圖。

- [ ] **Step 2: 逐張生成、檢查並接入角色圖**

  順序為偵探、建築師、AI 副駕、隊長、教練；每完成一張就檢查角色輪廓、手部／道具、文字污染與透明／留白需求，再生成下一張。

- [ ] **Step 3: 完成科技站視覺系統**

  使用奶油白、墨黑、珊瑚色、鼠尾草綠與資訊藍；建立清楚層級、手寫註記與少量角色微動畫，不使用霓虹、假儀表板或堆疊浮動卡片。

- [ ] **Step 4: 執行測試與三種視窗視覺驗收**

  Run: `cd ../豆米口科技官網 && npm test`
  Expected: PASS。
  Viewports: 1440×1000、390×844、320×700；確認無水平溢位、圖片不裁斷主體、結果 CTA 不遮住內容，減少動態設定下無非必要動畫。

- [ ] **Step 5: 提交角色視覺**

  Run: `git add images/roles index.html styles.css test/site.test.js && git commit -m "feat: introduce Xiaomi mission roles"`

### Task 6: 完成內容、品質與本機交付

**Files:**
- Create: `../豆米口科技官網/README.md`
- Modify: `../豆米口科技官網/index.html`
- Modify: `../豆米口科技官網/styles.css`
- Modify: `../豆米口科技官網/test/site.test.js`

**Interfaces:**
- Consumes: Task 1–5 的完整站點。
- Produces: 可本機預覽、測試並交給部署計畫的候選版本。

- [ ] **Step 1: 補齊內容與誠信契約測試**

  斷言每項服務都有「適合情境／交付成果／不適合情境／下一步」，示範案例明示為本專案，頁面不含未經證實的客戶數、百分比、見證或品牌 Logo。

- [ ] **Step 2: 完成方法、證據、FAQ、頁尾與跨站入口**

  主站連結使用 `https://domicotaiwan.com/`；所有外部連結說明目的，Email 在 JavaScript 關閉時仍可用。

- [ ] **Step 3: 撰寫維護說明並執行候選版驗收**

  Run: `cd ../豆米口科技官網 && npm test && python3 -m http.server 4174`
  Expected: 全部測試 PASS；瀏覽器無 console error、404 資源或主要操作死路。

- [ ] **Step 4: 提交可部署候選版本**

  Run: `git add README.md index.html styles.css test/site.test.js && git commit -m "docs: prepare DOMICO Labs release candidate"`
