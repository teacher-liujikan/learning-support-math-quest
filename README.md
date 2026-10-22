# 學習扶助數學闖關（二年級）

依每位學生 2026 年 5 月學習扶助「全卷錯誤」的學習指標，設計的互動闖關網頁。
學生掃 QR code 免登入作答，每一題記錄到老師的 Google 試算表；老師後台需要密碼。

## 檔案
| 檔案 | 用途 |
|---|---|
| `Code.gs` | Google Apps Script 後台：存作答紀錄、讀取全班紀錄、老師密碼（第 8 行 `TEACHER_PIN`） |
| `index.html` | 學生與老師看到的網頁（20 個關卡、全班進度表） |
| `student-qrcode.png` | 學生入口 QR code |

## 網址
- 學生入口：https://script.google.com/macros/s/AKfycbys7z0lwGT3AFz7yL58SR-gQrXtqUTvpJL2FoAWLWABNC0ZfQkg3m-18xLPkQ9_DK58/exec
- 老師後台：上面網址最後加上 `?mode=teacher`

## 更新方式
1. 在 Google 試算表開「擴充功能 → Apps Script」。
2. 把 `index`（或 `Code.gs`）的內容換成這裡的新版本，按儲存。
3. 「部署 → 管理部署作業 → 鉛筆圖示 → 版本選『新版本』→ 部署」。
   不要按「新增部署作業」，否則網址和 QR code 會改變。

## 注意
此專案含學生姓名，請維持 **Private（私人）**。
