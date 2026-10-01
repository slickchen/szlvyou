# 家游计划

家庭旅行计划工具：一份轻量网页（H5）加一份原生微信小程序源码。可创建多份旅行计划、复制旧计划、按天添加和调整地点，并在设备本地保存。

## 在线网页

仓库主页：<https://github.com/slickchen/szlvyou>

网页入口是仓库根目录的 `index.html`。打开 GitHub 仓库后点击该文件可以查看源码；GitHub 仓库地址和 GitHub Pages 网页地址不是同一个地址。若 `https://slickchen.github.io/szlvyou/` 显示 404，请在仓库的 **Settings → Pages** 中将 **Build and deployment** 来源设为 **Deploy from a branch**，分支选择 `main`、目录选择 `/ (root)` 并保存。Pages 首次发布需要几分钟。

网页数据默认只存在当前浏览器。可在网页里导出 JSON 备份，再在另一台设备导入。

## 微信小程序

小程序原生源码在 `miniprogram/`，使用微信开发者工具打开该文件夹即可预览。`project.config.json` 中的 `touristappid` 是体验用占位值；要上传到自己的小程序后台，请替换为自己的 AppID。

小程序头像：`miniprogram/assets/avatar-144.png`（144×144 PNG，约 14 KB）；矢量源文件为 `miniprogram/assets/avatar.svg`。在小程序后台的头像设置中上传 PNG 文件。

小程序的计划保存在本机，也可以在首页复制备份 JSON、从剪贴板导入备份。网页端和小程序共用行程 JSON 格式。当前版本不含云端数据库，因此设备间同步通过备份文件/文本完成。

## 示例行程

内置“广州 → 深圳三天两夜自驾游”示例，包含世界之窗、欢乐谷和前海华发冰雪世界初级道滑雪。门票、停车、道路和酒店信息请按出行日期重新核实。
