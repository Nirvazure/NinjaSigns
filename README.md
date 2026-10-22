# 火影结印 Web MVP

这是一个 Nuxt 4 / Vue 3 结印修炼场：摄像头画面在浏览器 Worker 内由 YOLOX-Nano 识别，不上传视频。公共目录和账号记录存于 YQYHub Supabase 的独立 `naruto_spiritism` schema，与 Artmind、RapperRank 共用 GitHub Auth 身份。首页提供 28 种忍术的逐步结印练习和单印练习；通灵之术、豪火球之术、千鸟保留 Canvas 2D 演出。

展览馆的“忍者图鉴”收录 25 位像素忍者，初始伙伴为鸣人。真实施放豪火球、千鸟、通灵之术后分别解锁佐助、卡卡西、波风水门；其余伙伴主要通过掌握指定忍术或忍术组合解锁，少量条件为掌握不同种类的忍术；重复施术不再推进解锁。图鉴显示每位忍者的解锁条件和进度，已解锁人物可设为修炼伙伴。有演出的忍术在演出结束后展示本次新解锁人物，其余忍术结印完成后立即展示；效果预览和单印练习不计奖励。

游客可浏览、预览和练习，不保存进度、不解锁忍者或保存伙伴选择。登录账号首次访问时从零掌握、初始鸣人开始，进度、收藏和伙伴可跨设备恢复。施术保存失败可在当前页面重试，重复请求只计一次；本期没有持久离线队列。新版启动只清理三个旧业务 localStorage 键，不导入或备份旧记录。直接访问 `/gallery?tab=ninjas` 可打开忍者图鉴。

运行时目录通过数据库 RPC 读取；`supabase/seed` 只用于初始迁移和测试。`attackPower` 范围为 0–100，0 表示辅助忍术无直接伤害。十二印的识别类别映射固定在模型适配代码中，不随目录展示顺序变化。

## 字体许可

项目使用 Fontsource 固定版本的本地字体：Ma Shan Zheng 5.3.1、Noto Sans SC 5.3.0 和 Press Start 2P 5.3.0。字体分别来自 [Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)、[Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc) 和 [Press Start 2P](https://github.com/google/fonts/tree/main/ofl/pressstart2p)，均采用 [SIL Open Font License 1.1](https://scripts.sil.org/OFL)。

## 开始

```bash
yarn install
cp .env.example .env  # 填入 YQYHub 的公开 Key
yarn dev
```

打开 [http://127.0.0.1:3000](http://127.0.0.1:3000)。摄像头需要 HTTPS 或 localhost；首次点击“开启摄像头”后才会请求权限。

## 常用检查

```bash
yarn test             # 识别、序列匹配、账号状态和隔离 PostgreSQL 集成测试
yarn test:e2e         # Edge：响应式、权限异常、展览馆和真实模型回放
yarn typecheck
yarn lint
yarn format:check
yarn build
```

应用运行只需 `SUPABASE_URL` 与 `SUPABASE_PUBLISHABLE_KEY`，无需数据库连接串或 Secret Key。`yarn db:status` 检查公开 Auth/目录 API，`yarn db:verify` 核对种子目录及游客 RPC 拒绝访问；两者不审计数据库内部权限。数据库维护改用 [Supabase 控制台维护](docs/database-console.md)。可选 OAuth 回调管理工具仍使用独立管理 Token，见 [Supabase 接入说明](docs/supabase.md)。

`yarn build` 使用 Nitro 生成生产包；开发环境使用 Vite SPA server，避免 Nuxt 开发 renderer 在无 SSR 页面上读取不存在的 manifest。生产预览可运行 `yarn preview`。

## 识别与素材

模型固定来自 [NARUTO-HandSignDetection](https://github.com/Kazuhito00/NARUTO-HandSignDetection)，来源 commit、MIT 许可和 SHA-256 写在 `public/models/provenance.json`。十二张手势示范图是仓库 README 中的真实标注样例，用于教学和模型烟测；它们不是独立评估集。真实摄像头的逐印、逐招式准确性仍需要在目标设备、光照和玩家手势上人工记录。

双人对战的房间码、施术事件同步、血量、冷却、胜负和断线处理记录在 `TODO.md`，本期入口只展示筹备状态。
