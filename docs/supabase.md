# Supabase 接入与上线

本应用共用 YQYHub（`tfvzcuksahcofooqqezx`）的 `auth.users` 和 GitHub Provider。业务对象全部位于 `naruto_spiritism`，不修改 Artmind、RapperRank 的业务对象或共享 Auth 表。各应用维持独立会话，退出仅注销本应用当前会话。

## 配置与命令

复制 `.env.example` 为 `.env`。应用运行只需要 `NUXT_PUBLIC_SUPABASE_URL` 和公开 `NUXT_PUBLIC_SUPABASE_KEY`。也支持参考应用的 `SUPABASE_URL` / `SUPABASE_KEY` 名称。禁止把数据库密码、Access Token 或 service-role Key 放入公开变量。

管理脚本额外使用 `DIRECT_DATABASE_URL`：YQYHub Session Pooler 的 5432 连接串。此环境不支持直连 IPv6，因此使用 `aws-1-ap-southeast-1.pooler.supabase.com:5432`。脚本自动下载并缓存 Supabase 官方数据库 CA，校验 SHA-256 指纹，使用 `verify-full` 验证证书和主机名；可通过 `SUPABASE_DB_CA_PATH` 指向同一官方 CA 的本地文件。

```bash
yarn db:migrate             # 按顺序应用 SQL，一次事务，记录名称与校验和
yarn db:expose              # 在已有 Data API schema 列表末尾追加本应用并通知重载
yarn db:status              # 核验 GitHub Provider、目录 API 和 schema 配置
yarn db:verify              # 核验真实目录、游客 RPC、RLS 和表/函数权限
yarn db:verify-transactions # 真实账号及并发锁的回滚事务验证，不留测试记录
yarn db:generate            # 在独立 PGlite 数据库应用全部迁移，只生成本 schema 类型
```

`db:migrate` 和 `db:expose` 为不同操作：前者只修改本应用 schema，后者更新项目级 Data API 配置并保留所有原有 schema。已应用迁移不得编辑；后续目录或结构变更应新增 SQL 文件。类型生成器不会重写迁移历史。

## GitHub 回调

已有 GitHub Provider 可复用，不在应用中配置 GitHub Secret。回调为 `/auth/callback`，Nuxt Supabase SDK 负责 PKCE 交换和刷新；回调页验证账号和个人状态后返回经过校验的站内 `next` 地址。

项目级回调白名单需要 `SUPABASE_ACCESS_TOKEN`，该 Token 与公开 Key、service-role Key 不同。将它放入本地 `.env`，并在 `APP_ORIGINS` 填写逗号分隔的实际来源域：本地 `http://localhost:3000`、`http://127.0.0.1:3000`、实际预览和生产 HTTPS origin。执行：

```bash
yarn auth:configure
```

脚本只追加这些 origin 的 `/auth/callback**`（含站内 next 查询参数），保留已有白名单和共享 `site_url`；读回配置验证成功后才报告完成。未提供管理 Token 时不会尝试更新 Auth 配置。

## 数据与事务

五张目录表允许游客与登录账号读取，禁止客户端修改。四张个人表按 Auth UUID 关联并级联删除；RLS 只允许本人读取，写入通过以下 RPC：

| RPC                                 | 行为                                           |
| ----------------------------------- | ---------------------------------------------- |
| `get_catalog()`                     | 返回有序的印、忍术及忍者解锁条件               |
| `get_my_state()`                    | 初始化本应用资料、鸣人与伙伴，返回本人状态     |
| `record_cast(jutsu_id, request_id)` | 账号行锁、请求去重、次数累加及解锁同一事务提交 |
| `select_companion(ninja_id)`        | 校验已解锁后更新伙伴和状态版本                 |

写入函数从 `auth.uid()` 获取身份，固定空 `search_path`，显式完整 schema 名，只授予 authenticated 执行权限。内部辅助函数不允许客户端执行。私有迁移账本同样启用 RLS 并撤销客户端权限。

客户端通过账号 epoch 丢弃上一账号迟到响应，通过单调版本防止旧状态覆盖新状态。账号切换清空进度、奖励和当前页面待重试记录，并暂停/reset 当前练习。真实施术立即播放演出，保存成功后才更新收藏和发奖；预览与单印练习不提交记录。

旧存储只删除 `naruto-spiritism.progress.v1`、`naruto-spiritism.companion.v1`、`naruto-spiritism.ninja-unlocks.v1`。存储不可访问不阻挡启动，旧内容不读取、不迁移、不备份。

## 2026-10-12 实施状态

- YQYHub 已应用 `202610120001_schema.sql` 与 `202610120002_catalog.sql`。
- Data API 已暴露 `naruto_spiritism`，原有 public、graphql_public、storage、rapperank、artmind 保留。
- 真实公开 API 返回 12 个印、28 个忍术、25 位忍者，完整内容与种子一致。
- GitHub Provider 已确认启用。真实表/函数权限、RLS 和游客拒绝访问已验证。
- 真实已有两个 Auth 用户在回滚事务中验证了初始化、施术重复请求、次数、伙伴、状态版本和 A/B 隔离；两个独立连接验证并发施术等待账号事务锁；测试数据均回滚。
- 最终 8 个测试文件、84 个测试通过，包含隔离 PostgreSQL 权限与业务事务测试。Nuxt 应用及脚本/测试 TypeScript 检查、ESLint、Prettier、生产构建均通过。
- 项目级回调白名单尚未核验/更新：环境没有 Supabase Access Token，连接的 Vercel 账号未返回本应用项目，实际部署域待提供。
- 按用户最新要求停止浏览器测试，真实 GitHub OAuth 人工登录与摄像头全流程不作为本次已完成验收声明。已有浏览器回归测试保留，可后续按需执行；此前一次摄像头冷启动测试未就绪，不能据此声明摄像头回归通过。

先部署数据库，再在部署环境设置两个公开变量并发布应用。上线前执行 `db:status`、`db:verify` 并完成回调白名单配置。发布异常可回退应用版本，保留云端表和记录。

参考：[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[自定义 schema](https://supabase.com/docs/guides/api/using-custom-schemas)、[Auth 配置管理 API](https://supabase.com/docs/reference/api/v1-update-auth-service-config)、[数据库 SSL](https://supabase.com/docs/guides/platform/ssl-enforcement)。
