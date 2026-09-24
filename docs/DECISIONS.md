# Design Decisions

## 2026-09-24：公共球员中文名称共享单一资源

公共球员的中文名称保存在 `backend/src/main/resources/player-catalog-chinese-names.json`。前端通过 Vite 别名读取该文件，Flyway V13 Java 迁移从同一资源写入 PostgreSQL。

该选择使浏览器目录与数据库使用同一份历史球员中文名称数据，避免维护多份名单。后续扩充历史目录时，需同步更新该资源、目录映射和覆盖数量测试；已发布的 Flyway 迁移文件保持不变，通过新增迁移补充数据库记录。

## 2026-09-24：前端字体随构建制品交付

`DM Mono`、`Manrope` 与 `Playfair Display` 由 `@fontsource` npm 包提供，并通过 `src/styles.css` 导入所需字重和拉丁字符集。Vite 将字体文件写入 `dist/assets`。

公网 HTTP 环境访问第三方字体服务可能失败。将字体随制品交付后，页面加载只依赖当前站点资源，Docker 和静态服务器无需额外配置外部字体域名。

## 2026-09-24：UUID 由依赖统一生成

`src/lib/identifier.ts` 统一调用 `uuid` 的 `v4()`，所有浏览器持久化 ID 通过该模块产生。

部分公网 HTTP 浏览器不提供 `crypto.randomUUID()`。`uuid` 使用可用的 Web Crypto 能力生成符合 RFC 4122 的标识符，游客工作区、导入幂等键和既有本地数据协议保持兼容。
