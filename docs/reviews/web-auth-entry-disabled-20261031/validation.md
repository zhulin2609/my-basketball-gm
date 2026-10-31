# Web 认证入口关闭验证

- Task：web-auth-entry-disabled-20261031。
- Date：2026-10-31（Asia/Shanghai）。
- Implementer：codex-web-auth-entry-20261031。
- Base Commit / HEAD：b0969bd910abfbf7bce16566930606dd781e10aa；develop；未提交变更。
- 用户批准：关闭 Web 注册、登录入口和认证路由，保留有效会话；微信小程序、后端和共享包保持现状。

## 自动化验证

- `npm run typecheck`：PASS；四个 workspace；`.cache/web-auth-typecheck.log`。
- `npm test -- apps/web/src/auth-disabled.test.tsx apps/web/src/lib/features.test.ts apps/web/src/App.test.tsx apps/web/src/community-disabled.test.tsx apps/web/src/scan-login.test.tsx`：FAIL；初次 45 通过、3 失败，新增测试的 status 与阵容文本定位匹配多个元素；改为定位实际游客提示和阵容按钮后由全量运行覆盖；`.cache/web-auth-targeted.log`。
- `npm test`：PASS；32 文件、180 项；真实 Spring Boot + 独立 PostgreSQL `stage4_frontend_1793460534125`；`.cache/web-auth-full-test.log`。
- `npm run build`：PASS；四个 workspace 的 typecheck 与 Web 生产构建；`.cache/web-auth-build.log`；仍有大于 500 kB 的 chunk 提示。
- `npx --no-install prettier --check <本轮修改的 ts/tsx/md 文件>`：PASS；已核对实现、测试和文档格式。
- `git diff --check`：PASS；无空白错误。

新增测试不替代项目 API。会话来自真实注册与登录接口；失效场景在独立数据库删除该测试创建的账号，真实 `/auth/me` 返回 401。已有扫码测试继续按 D-006 使用微信外部契约服务；本项目接口仍由 Spring Boot 和 PostgreSQL 处理。

## 测试用例映射

- T01–T03：PASS。`auth-disabled.test.tsx` 覆盖缺省及 false 配置、中英文、球员/阵容/对战页面、真实游客进度；Chrome 中英文切换正常。
- T04：PASS。四类认证 hash 的首次打开、重新挂载与后续 hash 导航；Chrome 打开 `#/auth` 并刷新。
- T05：PASS。hook 测试真实 `history.back()`、`history.forward()` 及内部 navigate；未渲染 auth，replaceState 不增加历史记录。
- T06：PASS。真实 HTTP 转发记录无注册、登录或票据请求；Chrome Network 116 条完整事件，无 `/api/` 请求。
- T07–T08：PASS。真实有效会话读取与保存账号阵容；退出后本地游客工作区原文一致、原账号阵容仍在服务器；刷新后保持游客。
- T09：PASS，覆盖服务端拒绝分支。真实已删除测试账号的有效签名会话被服务端拒绝，清除会话并显示游客提示；认证地址仍被阻止。
- T10：PASS。通过真实 React 表单保存球员简介、阵容并运行规则引擎；重新加载模块恢复完整工作区；Chrome 保存阵容、刷新恢复、运行对战。
- T11：PASS。真实账号发布帖子后清除会话，启用社区但关闭认证入口；游客只发出 GET，无认证、复制或评论写入入口。
- T12：PASS，限当前改动范围。Chrome 1440×900 与 390×844 的 DOM、导航、语言切换、键盘顺序、阵容新建与备案链接；球员列表横向溢出另记。
- T13：PASS。开启配置下新增真实登录/注册表单测试；保留 App 返回游客测试、社区关闭的认证页页脚测试与两项真实扫码票据测试；真实微信平台扫码验收 NOT RUN。
- T14：PASS。Git 变更限定于 Web、环境模板及文档；生产构建实测默认关闭。

## 实际浏览器

`npm run preview -- --host 127.0.0.1 --port 4179 --strictPort` 提供生产构建。使用 Chrome 的 DOM、键盘和 Network 事件检查，没有截图或图像分析。

- 桌面认证地址自动替换为 `#/players`，刷新后仍为球员库；认证表单和认证按钮数量均为 0。
- 桌面 Tab 顺序：球员库、我的阵容、梦幻对战、中文、EN、新建阵容、查看当前阵容。
- 窄屏 Tab 顺序：Players、Roster、battle、中文、EN、View current roster。窄屏阵容页面的新建按钮正常创建空阵容。
- 窄屏保存阵容后刷新，名称仍为“浏览器游客验证”；选取两个有效阵容运行规则引擎，产生本场最佳球员和战报。
- 网络观察从认证地址访问与刷新前开始，覆盖保存、刷新、新建和对战；116 条 `Network.requestWillBeSent`，无截断、无后续分页、无 API 请求。Console error/warn 为空。
- 测试后恢复浏览器视口、关闭测试标签页并停止本轮预览服务。

## 范围与限制

- 390 像素视口下球员列表右边界为 431.66 像素，出现横向溢出；应用容器、导航及新游客提示均保持 390 像素。球员列表与样式未在本轮修改，未扩展任务处理。
- 后端认证接口、已登录用户和旧版已打开页面保留原有能力；本次前端限制不改变服务端认证策略。
- 后端完整测试、真实微信平台扫码及生产部署验收 NOT RUN；本次没有修改后端或小程序，也没有发布授权。
- `.cache` 中的运行日志仅保存在本机；独立审查结论由独立报告给出。
