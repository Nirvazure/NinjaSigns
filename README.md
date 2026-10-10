# 火影结印 Web MVP

这是一个本地优先的 Nuxt 4 / Vue 3 结印修炼场：摄像头画面在浏览器 Worker 内由 YOLOX-Nano 识别，不上传视频。首页提供 28 种忍术的逐步结印练习和单印练习；通灵之术、豪火球之术、千鸟保留 Canvas 2D 演出，其余 25 种在结印完成后直接记录掌握进度。展览馆展示十二基础印、完整忍术目录、招式顺序和本机掌握进度。

展览馆的“忍者图鉴”收录 25 位像素忍者，初始伙伴为鸣人。真实施放豪火球、千鸟、通灵之术后分别解锁佐助、卡卡西、波风水门；其余伙伴主要通过掌握指定忍术或忍术组合解锁，少量条件为掌握不同种类的忍术；重复施术不再推进解锁。图鉴显示每位忍者的解锁条件和进度，已解锁人物可设为修炼伙伴。有演出的忍术在演出结束后展示本次新解锁人物，其余忍术结印完成后立即展示；效果预览和单印练习不计奖励。

忍术进度沿用 `naruto-spiritism.progress.v1`，伙伴选择单独保存在 `naruto-spiritism.companion.v1`。记录仅保存在当前浏览器；首次升级将旧规则已经解锁的伙伴保存到 `naruto-spiritism.ninja-unlocks.v1`，后续按新规则解锁。直接访问 `/gallery?tab=ninjas` 可打开忍者图鉴。

本地忍术数据 `app/domain/jutsu-data.ts` 为全部 28 个忍术提供 `attackPower`，初始范围为 0–100，0 表示辅助忍术无直接伤害。这是可调整的游戏平衡初值，后续对战可直接读取。

## 字体许可

项目使用 Fontsource 固定版本的本地字体：Ma Shan Zheng 5.3.1、Noto Sans SC 5.3.0 和 Press Start 2P 5.3.0。字体分别来自 [Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)、[Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc) 和 [Press Start 2P](https://github.com/google/fonts/tree/main/ofl/pressstart2p)，均采用 [SIL Open Font License 1.1](https://scripts.sil.org/OFL)。

## 开始

```bash
yarn install
yarn dev
```

打开 [http://127.0.0.1:3000](http://127.0.0.1:3000)。摄像头需要 HTTPS 或 localhost；首次点击“开启摄像头”后才会请求权限。

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
