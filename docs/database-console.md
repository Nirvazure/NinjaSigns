# Supabase 控制台维护

应用和公开 API 检查只使用 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`。不配置数据库连接串、CA 路径或 Secret Key。当前没有需要高权限服务端客户端的业务，新建的 naruto Secret Key 无需使用。

## 本次清理

此次不改表、RPC、RLS 或业务数据，不需要重新执行数据库迁移。旧的直连迁移、schema 暴露和云端双连接核验工具已移除；本地 PGlite 权限/事务测试和类型生成保留。

## 后续结构迁移

1. 在 Supabase 确认目标项目是 YQYHub，Project Ref 为 `tfvzcuksahcofooqqezx`；测试环境使用对应测试项目。
2. 在 SQL Editor 查询 `select name, checksum, applied_at from naruto_spiritism.schema_migrations order by name;`，与仓库迁移清单比较。已应用的两份历史迁移不重跑、不编辑。目标数据库没有账本时，先确认是新环境还是历史账本缺失。
3. 后续变更在 `supabase/migrations/` 新建按时间排序的 SQL，只修改本应用对象。先运行 `yarn test` 和 `yarn db:generate`。
4. 使用下面的本地命令计算最终 SQL 文件规范化为 LF 后的 SHA-256，记录输出文件名和 checksum。

```powershell
node --input-type=module -e 'import { readFileSync } from "node:fs"; import { createHash } from "node:crypto"; const file=process.argv[1]; console.log(file.split(/[\\/]/).at(-1), createHash("sha256").update(readFileSync(file,"utf8").replaceAll("\r\n","\n")).digest("hex"))' supabase/migrations/新迁移文件.sql
```

5. 执行前单独查账本：同名同 checksum 跳过，同名不同 checksum 停止并新增修正迁移。将下面各项放在 SQL Editor 的同一个查询中依次执行：`begin;`、`select pg_advisory_xact_lock(hashtext('naruto_spiritism:migrations'));`、新 SQL 全文、账本 insert、`commit;`。账本 insert 使用 `insert into naruto_spiritism.schema_migrations(name, checksum) values ('实际文件名.sql', '实际64位SHA256');`，不用 `on conflict do nothing` 隐藏错误。DDL 与账本写入必须同一事务；报错后执行 `rollback;` 并排查原因。
6. 新环境首次部署先在事务内创建 schema 和账本：`create schema if not exists naruto_spiritism; create table naruto_spiritism.schema_migrations(name text primary key, checksum text not null, applied_at timestamptz not null default now());`。按顺序应用全部迁移并记录各自 checksum，执行 `alter table naruto_spiritism.schema_migrations enable row level security; revoke all on naruto_spiritism.schema_migrations from public, anon, authenticated;` 后提交。首次部署流程不适用于已有生产库。
7. 读回账本，运行只读权限核验和公开 API 检查，保存执行记录。应用部署与数据库迁移分别执行。本次仅清理连接工具，无需上述迁移操作。

## Data API 和 OAuth 配置

- Data API 的 Exposed schemas 仅追加 `naruto_spiritism`，保留已有全部 schema。暴露 schema 不代表授予表或函数权限。
- Authentication → URL Configuration 追加本应用实际 origin 对应的 `/auth/callback**`，保留其他应用回调和共享 Site URL。
- 可选 `yarn auth:configure` 仍使用独立 `SUPABASE_ACCESS_TOKEN` 和 `APP_ORIGINS`，仅在本地管理时配置，不放入 Vercel。公开 Key 和 Secret Key 不能代替管理 Token。

## 验证

- SQL Editor 执行 [`verify-permissions.sql`](../supabase/maintenance/verify-permissions.sql) 全文。只读查询检查预期的 10 张表（含账本）、6 个函数、RLS 开关、角色权限和固定 search_path；结果列出不符合项，零行代表这些检查通过。不审查全部 RLS 表达式或验证业务并发，后续新增对象时同步预期列表。
- `yarn db:status` 检查 GitHub Provider 和有效目录；`yarn db:verify` 精确比较种子目录并检查游客对私有/内部 RPC 的访问被拒。需要 `.env` 中两个公开变量，不访问数据库内部配置。
- PGlite 测试继续覆盖权限、账号隔离、幂等与业务事务。真实云端双连接并发和真实用户回滚工具已删除，以上检查不能替代它们。
- 上线后用真实账号验证登录、进度恢复、重复请求、伙伴选择和账号切换；多人并发需另行设计独立测试环境。

## Vercel 清理

确认 `ninja-signs` 关联 `Nirvazure/Naruto-Spiritism`，Build/Install Command 未调用旧管理脚本。移除本项目数据库连接变量；来自团队 Shared 时仅解除本项目关联，不删除共享变量本身。保留两个公开变量，不新增 Secret Key 或 Management Token。清理后重新部署，现有部署不会自动更新变量。
