# 火影结印 Web MVP

这是一个本地优先的 Nuxt 4 / Vue 3 结印修炼场：摄像头画面在浏览器 Worker 内由 YOLOX-Nano 识别，不上传视频。首页提供三种忍术的逐步结印练习、单印练习和 Canvas 2D 演出；展览馆展示十二基础印、招式顺序和本机掌握进度。

## 开始

```bash
yarn install
yarn dev:mvp
```

打开 [http://127.0.0.1:3035](http://127.0.0.1:3035)。摄像头需要 HTTPS 或 localhost；首次点击“开启摄像头”后才会请求权限。普通 `yarn dev` 也可使用，但 MVP 脚本使用独立的 `.nuxt-mvp` 构建目录和 3035 端口，适合与其他 Nuxt 服务并行运行。

## 常用检查

```bash
yarn test             # 稳定确认、序列匹配和掌握记录
yarn test:e2e         # Edge：响应式、权限异常、展览馆和真实模型回放
yarn typecheck
yarn lint
yarn format:check
yarn build
```

`yarn build` 使用 Nitro 生成生产包；开发环境使用 Vite SPA server，避免 Nuxt 开发 renderer 在无 SSR 页面上读取不存在的 manifest。生产预览可运行 `yarn preview`。

## 识别与素材

模型固定来自 [NARUTO-HandSignDetection](https://github.com/Kazuhito00/NARUTO-HandSignDetection)，来源 commit、MIT 许可和 SHA-256 写在 `public/models/provenance.json`。十二张手势示范图是仓库 README 中的真实标注样例，用于教学和模型烟测；它们不是独立评估集。真实摄像头的逐印、逐招式准确性仍需要在目标设备、光照和玩家手势上人工记录。

双人对战的房间码、施术事件同步、血量、冷却、胜负和断线处理记录在 `TODO.md`，本期入口只展示筹备状态。
