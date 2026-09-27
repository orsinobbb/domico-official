# 豆米口形象官網與免費部署架構

## 目標

建立「豆米口 DOMICO」第一版正式形象官網，讓訪客先認識三位角色、產生故事共鳴，再自然前往漫畫與商品概念。主站部署於 GitHub Pages，確保家中電腦離線時仍可瀏覽；本機服務則透過 Cloudflare Tunnel 對外，不再依賴直接暴露 3001 連接埠。

## 品牌與體驗

- 母品牌使用「豆米口 DOMICO」。
- 文創識別使用「豆米口製造所 DOMICO STUDIO」。
- 科技識別保留「豆米口科技 DOMICO LABS」，第一版只在品牌說明中出現，不建立獨立產品頁。
- 語氣溫暖、有趣、不催促購買；商品維持概念展示，不標價、不建立假購物流程。
- 使用者旅程依序為：認識角色 → 選擇當下心情 → 閱讀漫畫 → 收藏商品 → 留下對下一步的期待。

## 資訊架構

1. 首屏：一句可記住的品牌主張、三位角色主視覺、明確的故事入口。
2. 角色：小豆、小米、小口的性格與可互動切換。
3. 心情入口：依訪客當下狀態推薦角色、漫畫與商品。
4. 漫畫：三篇可翻閱短篇與輕量共鳴回饋。
5. 商品：十項周邊概念、分類、收藏與物件故事。
6. 品牌說明：DOMICO STUDIO 的創作理念，以及 DOMICO LABS 作為未來數位體驗支線。
7. 收尾：回到故事、追蹤未來更新，不要求登入或付款。

## 靜態網站要求

- 保留純 HTML、CSS、JavaScript，不加入建置框架或外部執行依賴。
- 所有資源使用相對路徑，能在自訂網域與 GitHub Pages 預覽網址正常載入。
- 補齊 canonical、Open Graph、Twitter Card、favicon、manifest、robots.txt、sitemap.xml 與 404 fallback。
- 適配手機與桌面，尊重 `prefers-reduced-motion`，互動元件具備可辨識名稱與鍵盤操作。
- 不在前端保存 API 密鑰、Cloudflare 憑證或其他機密。

## 部署架構

- `domicotaiwan.com` 與 `www.domicotaiwan.com`：獨立公開 GitHub 儲存庫 `orsinobbb/domico-official` 的 GitHub Pages。
- 舊儲存庫 `orsinobbb/GitTest1140409` 完整保留；只移轉自訂網域，不刪除舊檔案。
- 先驗證新儲存庫的 GitHub Pages 預覽，再切換 CNAME，降低中斷時間。
- GitHub Pages 發布失敗時，不變更既有自訂網域。

## Cloudflare Tunnel

- 沿用既有 Tunnel `my-home-server`。
- `studio.domicotaiwan.com` 指向 `http://127.0.0.1:4173`，作本機預覽。
- `gateway.domicotaiwan.com` 指向 `http://127.0.0.1:3001`，作既有服務入口。
- Tunnel 設定最後必須有 `http_status:404` fallback。
- `cloudflared` 由 macOS LaunchAgent 常駐並自動重啟。
- 主官網不依賴 Tunnel；家中電腦離線只影響兩個子網域。

## 驗收

- 單元測試全部通過。
- 本機與 GitHub Pages 預覽均能載入 HTML、CSS、JavaScript、漫畫與商品圖片。
- 手機與桌面皆無水平溢出，主要互動可完成。
- `domicotaiwan.com` 回傳正式豆米口首頁並強制 HTTPS。
- Tunnel 兩個子網域能到達正確本機服務，程序重新啟動後可自行恢復。

