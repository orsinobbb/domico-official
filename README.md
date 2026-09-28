# 豆米口 DOMICO 官方網站

豆米口的品牌與原創 IP 主站。網站以「會動的故事書」為核心，讓訪客從心情、角色、漫畫與今日小善意自然走到收藏、親子教育或品牌合作；小豆、小米、小口保有自己的個性與故事，不作為服務的附屬吉祥物。

正式網址規劃為 `https://domicotaiwan.com/`，並與豆米口科技 `https://tech.domicotaiwan.com/` 分站互相導流。

## 內容架構

- `src/ip-content.js`：角色層次、故事季、七張善意卡與三種受眾路徑，是內容的單一來源。
- `src/state.js`：可測試的純狀態函式，包含舊版狀態遷移、可撤回收藏、故事導覽與抽卡。
- `src/app.js`：瀏覽器互動與漸進增強；沒有登入或後端也能完整閱讀。
- `images/comics/`、`products/`：漫畫與商品概念圖；HTML 保留沒有圖片時仍可理解的內容。

瀏覽狀態只儲存在使用者的 `localStorage`。善意分享優先使用系統分享，其次複製到剪貼簿，最後顯示可手動選取的文字，不會蒐集姓名、信箱或完成紀錄。

## 本機預覽

```bash
npm run dev
```

然後開啟 `http://localhost:4173` (按下 `Control + C` 可停止)。

## 測試

```bash
npm test
```

測試涵蓋靜態資源、品牌 metadata、角色與故事內容契約、狀態遷移、可逆收藏、分眾入口與分享文案。發佈前另以 1440×1000、390×844、320×700 驗收響應式版面、鍵盤焦點、破圖與 console error。

## 聯絡與發布

- 公開 Email：`hello@domicotaiwan.com`（規劃由 Cloudflare Email Routing 轉寄至管理信箱）。
- LINE：只有在官方帳號及公開加好友網址實際驗證後才會顯示連結；目前頁面保留安全的準備中說明。
- 主站採 GitHub Pages，不依賴居家電腦或 Cloudflare Tunnel 在線。
- `studio.domicotaiwan.com` 與 `gateway.domicotaiwan.com` 可由 Cloudflare Tunnel 分別代理本機服務，但不應成為正式靜態網站的依賴。

正式發佈前請確認 `CNAME`、`sitemap.xml`、`robots.txt`、canonical 與 Open Graph 網址一致，並實際檢查 apex、www、HTTPS、圖片與跨站連結。
