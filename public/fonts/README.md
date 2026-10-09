# 本地字体

三种字体使用 Fontsource 固定版本，由 Vite 打包到本地资源；不会从外部字体服务请求文件。

- Ma Shan Zheng 5.3.1：中文标题与招式题字，来源 https://github.com/google/fonts/tree/main/ofl/mashanzheng。
- Noto Sans SC 5.3.0：中文正文，来源 https://github.com/google/fonts/tree/main/ofl/notosanssc。
- Press Start 2P 5.3.0：数字与少量英文 HUD，来源 https://github.com/google/fonts/tree/main/ofl/pressstart2p。

采用按 unicode-range 分包的 WOFF2，font-display: swap；浏览器只获取页面实际使用的字形分包。包内 WOFF 作为旧浏览器后备。对应 OFL 许可保留在本目录。
