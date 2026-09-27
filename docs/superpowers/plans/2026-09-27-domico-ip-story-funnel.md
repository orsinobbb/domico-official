# 小豆・小米・小口故事與善意漏斗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 深化小豆、小米、小口的人格、首季故事與今日小善意，讓粉絲、親子教育與企業合作訪客都能從共鳴自然走到適合的下一步。

**Architecture:** 保留現有單頁漫畫與商品體驗，新增集中式 IP 內容模組和純狀態函式，避免角色資料繼續散落在 DOM 程式中。以漸進增強提供收藏、抽卡、複製分享與分眾導流；沒有 JavaScript 時仍可閱讀首季、角色層次和三條入口。

**Tech Stack:** HTML5、CSS、原生 ES modules、Node.js test runner、localStorage、Web Share／Clipboard 漸進增強

**Spec:** `docs/superpowers/specs/2026-09-27-domico-brand-ecosystem-design.md`

## Global Constraints

- 小豆、小米、小口不設定明確年齡，各自具備外在印象、內在矛盾與正在學習的事。
- 故事同時保有真實日常與一點奇幻想像；善意以角色選擇呈現，不說教。
- 首版沿用三則現有漫畫作為單一故事季起點，不承諾尚未完成的週更頻率。
- 今日小善意固定七張，預設不收集姓名、Email 或公開貼文內容。
- 商品維持故事延伸物，不新增價格、結帳、庫存或假倒數促銷。
- 粉絲、親子教育、企業合作共用同一品牌世界，但下一步與文案按意圖分流。
- 既有收藏與旅程資料必須向後相容；localStorage 失敗不得阻斷閱讀。

## Review Focus

- 舊版 `doumikou-journey` 只有 `moments`／`wishlist` 時仍能載入，不得清空既有收藏；Task 2 的遷移測試覆蓋。
- 故事到第一篇／最後一篇時，上一則／下一則不得成為死路或指向不存在內容；Task 2、3 覆蓋。
- Web Share、Clipboard 或 localStorage 不可用時，善意卡仍可閱讀並手動複製；Task 4 覆蓋。
- 使用者取消收藏或重新抽卡時，回饋必須可逆且不製造虛假的進度壓力；Task 2、4 覆蓋。
- 320px、鍵盤與減少動態環境仍可閱讀角色、三篇漫畫並選擇分眾入口；Task 5 覆蓋。

---

### Task 1: 集中角色、故事季與善意內容

**Files:**
- Create: `src/ip-content.js`
- Create: `test/ip-content.test.js`
- Modify: `src/app.js`

**Interfaces:**
- Consumes: `app.js` 既有 `characters`、三則漫畫順序與規格首版邊界。
- Produces: `characters: readonly CharacterProfile[]`、`storySeason: StorySeason`、`kindnessCards: readonly KindnessCard[]`、`audiencePaths: readonly AudiencePath[]`。

- [ ] **Step 1: 寫入內容契約失敗測試**

  斷言三位角色各有唯一 ID、`outerImpression`、`innerConflict`、`learning`、`strengths`、`blindSpots` 與不含明確年齡的描述；首季精確包含三篇漫畫及循序關係；善意卡精確七張；分眾入口精確為 fan、family、partner。

- [ ] **Step 2: 執行測試並確認模組尚未存在而失敗**

  Run: `node --test test/ip-content.test.js`
  Expected: FAIL。

- [ ] **Step 3: 建立內容模組並移除 app.js 的重複角色常數**

  每篇故事提供 `id`、`title`、`theme`、`characterIds`、`previousId`、`nextId` 與現有圖片路徑；三位角色均避免被單一優點定義。

- [ ] **Step 4: 執行完整測試並提交**

  Run: `npm test`
  Expected: PASS。
  Run: `git add src/ip-content.js src/app.js test/ip-content.test.js && git commit -m "feat: define layered IP story world"`

### Task 2: 擴充可逆收藏、故事導覽與狀態遷移

**Files:**
- Modify: `src/state.js`
- Modify: `test/state.test.js`

**Interfaces:**
- Consumes: Task 1 的 `storySeason`、`kindnessCards`，既有 `JourneyState {moments,wishlist}`。
- Produces: `normalizeJourneyState(value): JourneyStateV2`、`toggleFavorite(state, type, id): JourneyStateV2`、`getStoryNeighbor(season, storyId, direction): StoryEntry | null`、`pickKindnessCard(cards, seed): KindnessCard`、`getAudienceNextStep(audienceId): AudienceNextStep`。

- [ ] **Step 1: 寫入狀態與 Review Focus 的失敗測試**

  測試舊狀態遷移後保留 `moments`／`wishlist` 並新增 `favoriteCharacters`／`favoriteStories`／`favoriteKindnessCards`；相同收藏可取消；首篇 previous 與末篇 next 明確回傳 `null`；同一 seed 抽卡穩定且不同合法 seed 不越界；未知 audience 丟出可理解錯誤。

- [ ] **Step 2: 執行測試確認新函式缺少而失敗**

  Run: `node --test test/state.test.js`
  Expected: FAIL。

- [ ] **Step 3: 實作 V2 狀態與純函式**

  `normalizeJourneyState` 僅接受字串陣列、去除重複與未知型別；既有 `createJourneyState`、`toggleWishlist`、`getJourneyStage` 保持相容。

- [ ] **Step 4: 執行完整測試並提交**

  Run: `npm test`
  Expected: PASS。
  Run: `git add src/state.js test/state.test.js && git commit -m "feat: extend reversible IP journey state"`

### Task 3: 將角色層次與故事季接入頁面

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `styles.css`
- Modify: `test/site.test.js`

**Interfaces:**
- Consumes: Task 1 內容與 Task 2 的故事／收藏 API。
- Produces: 三位角色完整層次、首季入口、三篇前後篇與角色頁路徑。

- [ ] **Step 1: 寫入靜態與互動契約失敗測試**

  斷言 `#friends` 提供三層人格標題，`#comic` 具有故事季名稱／主題／篇次，三篇皆有角色、上一則、下一則和相關善意 action；沒有空 `href` 或不存在 fragment。

- [ ] **Step 2: 執行測試確認新內容尚未接入而失敗**

  Run: `npm test`
  Expected: FAIL。

- [ ] **Step 3: 更新角色卡與故事季語意結構**

  預設 HTML 直接提供第一位角色與首篇完整資訊；JavaScript 切換時同步更新可見內容、`aria-selected`、篇次、前後篇 disabled 狀態與焦點提示。

- [ ] **Step 4: 驗證每條漫畫路徑沒有閱讀死路**

  從三篇任一篇出發，必須能到角色、另一篇故事、今日小善意與相關故事物件；邊界按鈕顯示「回到故事季」而非失效。

- [ ] **Step 5: 執行測試並提交**

  Run: `npm test`
  Expected: PASS。
  Run: `git add index.html src/app.js styles.css test/site.test.js && git commit -m "feat: guide readers through first story season"`

### Task 4: 加入七張今日小善意與安全分享

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/state.js`
- Modify: `styles.css`
- Modify: `test/state.test.js`
- Modify: `test/site.test.js`

**Interfaces:**
- Consumes: Task 1 的 `kindnessCards`、Task 2 的抽卡與收藏 API。
- Produces: `buildKindnessShareText(card): string` 與不蒐集資料的抽卡、收藏、分享 UI。

- [ ] **Step 1: 寫入分享與降級失敗測試**

  斷言分享文字包含行動、角色語氣與 `https://domicotaiwan.com/`，不包含使用者輸入；頁面具有可選取的文字備援、重新抽卡和 `aria-live` 回饋。

- [ ] **Step 2: 執行測試確認失敗**

  Run: `npm test`
  Expected: FAIL。

- [ ] **Step 3: 實作抽卡、收藏與漸進式分享**

  優先使用 Web Share，其次 Clipboard，兩者失敗時顯示文字與「長按複製」提示；重新抽卡不計入更高漏斗階段，收藏可隨時取消。

- [ ] **Step 4: 以可用與不可用 API 各驗收一次**

  Expected: 三種分享分支均能讓使用者取得文字，無 console error，且從未要求權限才能閱讀卡片。

- [ ] **Step 5: 執行完整測試並提交**

  Run: `npm test`
  Expected: PASS。
  Run: `git add index.html src/app.js src/state.js styles.css test/state.test.js test/site.test.js && git commit -m "feat: add daily kindness ritual"`

### Task 5: 建立三條分眾入口與雙站導流

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `styles.css`
- Modify: `test/site.test.js`
- Modify: `sitemap.xml`

**Interfaces:**
- Consumes: Task 1 的 `audiencePaths`、已發布的科技站與已驗證聯絡 URL。
- Produces: 粉絲、親子教育、企業合作三條可理解下一步，以及主站到科技站的明確跨站入口。

- [ ] **Step 1: 寫入分眾與外部連結失敗測試**

  斷言 fan 導向故事／LINE、family 導向親子使用方式／Email、partner 導向合作說明／Email；科技服務連結精確為 `https://tech.domicotaiwan.com/`，外部連結具目的文字而非只有「了解更多」。

- [ ] **Step 2: 執行測試確認分眾區尚未完成而失敗**

  Run: `npm test`
  Expected: FAIL。

- [ ] **Step 3: 實作分眾路徑與品牌關係說明**

  說明豆米口文創與 DOMICO LABS 同屬母品牌；三條路徑共用善意價值，但不把角色故事降格為科技服務吉祥物。

- [ ] **Step 4: 完成 1440、390、320px 與鍵盤視覺驗收**

  確認三條路徑在窄螢幕不水平溢位、焦點可見、減少動態時無強制動畫；角色、漫畫、善意與分眾 CTA 的視覺主次清楚。

- [ ] **Step 5: 執行測試並提交**

  Run: `npm test`
  Expected: PASS。
  Run: `git add index.html src/app.js styles.css test/site.test.js sitemap.xml && git commit -m "feat: connect IP audiences and DOMICO Labs"`

### Task 6: 正式站整體驗收與文件更新

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 1–5 與聯絡部署計畫的正式 URL。
- Produces: 已發布、可維護且與科技站互相導流的 IP 官網。

- [ ] **Step 1: 執行完整測試與靜態資源檢查**

  Run: `npm test && git diff --check`
  Expected: 全部 PASS，無空白錯誤。

- [ ] **Step 2: 完成桌面與手機主要旅程**

  依序驗收「心情 → 角色 → 故事 → 善意 → 收藏 → 分眾下一步」，再從科技站返回 IP 主站；確認無 console error、404 圖片或操作死路。

- [ ] **Step 3: 推送並驗證正式站**

  驗證 apex、www、HTTPS、Open Graph 圖、腳本、漫畫與商品／角色圖片皆成功；Tunnel 離線時正式站不受影響。

- [ ] **Step 4: 更新維護說明並提交**

  Run: `git add README.md && git commit -m "docs: document IP story funnel" && git push origin main`
