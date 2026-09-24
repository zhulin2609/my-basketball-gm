# Design Decisions

## 2026-09-24：公共球员中文名称共享单一资源

公共球员的中文名称保存在 `backend/src/main/resources/player-catalog-chinese-names.json`。前端通过 Vite 别名读取该文件，Flyway V13 Java 迁移从同一资源写入 PostgreSQL。

该选择使浏览器目录与数据库使用同一份历史球员中文名称数据，避免维护多份名单。后续扩充历史目录时，需同步更新该资源、目录映射和覆盖数量测试；已发布的 Flyway 迁移文件保持不变，通过新增迁移补充数据库记录。
