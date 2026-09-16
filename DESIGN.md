# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-09-16
- Primary product surfaces: 球员库、我的阵容、梦幻对战
- Evidence reviewed: `README.md`、`src/App.tsx`、`src/lib/api.ts`、`src/lib/repository.ts`、`src/data/players.ts`、`src/types.ts`、`db/schema.sql`、`src/styles.css`、`backend/src/main/java/com/links/basketballgm/simulation/SimulationService.java`、`AGENTS.md`

## Brand

- Personality: 克制、复古、偏数据工具而不是官方体育产品。
- Trust signals: 明确的阵容规则、能力值来源提示、非官方免责声明。
- Avoid: 联盟/球队标志、球员图片、重度拟物球场元素和需要学习成本的操作。

## Product goals

- Goals: 让用户快速浏览或创建球员、调整能力档案、组建阵容并进行对战模拟。
- Non-goals: 复刻真实联赛、提供实时数据或社交功能。
- Success signals: 用户无需切换页面即可完成阵容增删与位置设置。

## Personas and jobs

- Primary personas: 熟悉篮球历史、想搭配理想阵容的桌面端用户。
- User jobs: 找到或创建球员、调整能力属性、把他放进当前阵容、调整角色、查看模拟结果。
- Key contexts of use: 手机优先的 H5 体验，同时支持 PC 浏览器中的高密度探索和反复比较。

## Information architecture

- Primary navigation: 球员库 / 我的阵容 / 梦幻对战。
- Core routes/screens: 球员浏览页、阵容编辑工作台、比赛战报页。
- Content hierarchy: 当前阵容与编辑动作优先于辅助说明；详情用于确认而非阻塞编辑。

## Design principles

- 就地完成: 编辑阵容所需动作必须在阵容页可用。
- 规则可见: 人数、激活状态和首发位置在操作点附近展示。
- 渐进披露: 球员详情保留在资料库；阵容页的选择器只展示足以决策的信息。
- 本地优先: 对战始终可以使用内置规则引擎；AI 只是用户主动选择的实验性增强，不得成为开始比赛的前置条件。
- 风险在操作前告知: AI 模式的耗时、可能费用和模型兼容性要在选项旁说明，不只在报错后说明。
- 语言稳定性: 简体中文与英文共享同一套结构化翻译 key；语言切换不得改变任何阵容、对战或登录状态。
- Tradeoffs: 移动端优先保证单列选择与大点击区；桌面端再提升信息密度。

## Visual language

- Color: 深绿黑背景、浅米文字、浅绿作为主操作和合规状态。
- Typography: Playfair Display 用于标题，Manrope 用于正文，DM Mono 用于数值标签。
- Spacing/layout rhythm: 8px 基础间距；编辑工作台使用表格和窄边栏。
- Shape/radius/elevation: 低圆角、细描边；仅主操作使用轻微阴影。
- Motion: 不依赖动画传递状态。
- Imagery/iconography: 只使用文字缩写和抽象色块头像。

## Components

- Existing components to reuse: `primary`、`ghost`、`search`、`tag`、`portrait`、`roster-row`。
- New/changed components: 球员库的“自定义球员”入口、右侧球员编辑器、身高（英尺/英寸）与体重（磅）的基础资料字段、阵容页内嵌球员选择器、首发位置规则提示、对战页的“本地模拟 / AI 模拟”模式选择器、全局中英语言切换控件，以及球员详情中的各项能力值。
- Variants and states: 默认、编辑中、输入校验失败、搜索无结果、已加入隐藏、15 人满编禁用、首发位置缺失、首发位置已配齐、本地模拟已选中、AI 已配置可选、AI 未配置禁用、模拟中、模拟失败。
- Token/component ownership: 样式统一在 `src/styles.css`，页面逻辑在 `src/App.tsx`，本地球员覆盖在 `src/lib/repository.ts`。

## Accessibility

- Target standard: 基本 WCAG 2.1 AA 可读性与键盘可操作性。
- Keyboard/focus behavior: 搜索框和候选按钮按 DOM 顺序聚焦；禁用按钮不可触发。
- Contrast/readability: 正文与背景维持高对比；小号数据标签不得承载唯一信息。
- Screen-reader semantics: 输入框须有 `aria-label`，操作按钮使用清晰动词。
- Language: 语言切换器正确声明当前语言；日期、数字和货币随语言区域显示。
- Reduced motion and sensory considerations: 当前无必要动画。

## Responsive behavior

- Supported breakpoints/devices: 以 360px 及以上手机宽度为基线；900px 以上增强为桌面端高密度布局。
- Layout adaptations: 选择器候选条目自动换行；对战模式卡片和阵容选择在窄屏变为单列，避免横向页面滚动。
- Touch/hover differences: 所有 hover 信息以可点击文本和状态标签兜底。

## Interaction states

- Loading: 离线 MVP 立即显示；后端接入时在候选列表显示加载状态。
- Empty: 无候选时说明可能已全部加入或搜索无结果。
- Error: 球员名称和缩写为空时阻止保存并提示；身高限制为 4–8 英尺和 0–11 英寸，体重限制为 80–500 磅；后端接入时显示可恢复错误。
- Success: 保存球员后立即更新球员库、阵容选择器和模拟数据源；单击候选球员立即进入名单，候选项随即消失。
- Disabled: 达到 15 人时禁用加入并说明原因；对战前高亮缺失的首发位置；未配置 API Key 时禁用 AI 选项但保持本地模拟主操作可用。
- Offline/slow network, if applicable: 离线 MVP 将自定义球员和对默认档案的覆盖写入 localStorage，不依赖网络；云端版本以当前登录用户归属自定义球员，并以用户覆盖档案合并预置球员的调节值。

## Content voice

- Tone: 简洁、像懂球的搭档，不模拟官方联赛口吻。
- Terminology: 使用“阵容”“首发”“激活”“非激活”“加入阵容”。
- Microcopy rules: 操作按钮用动词；规则提示直接说明限制。

## Implementation constraints

- Framework/styling system: React、TypeScript、Vite、单一 CSS 文件。
- Design-token constraints: 复用现有颜色与按钮类，不引入新 UI 依赖。
- Performance constraints: 候选列表为本地小数据集，直接过滤即可。
- Compatibility constraints: 现代桌面浏览器；保留 900px 响应式规则。
- i18n constraints: 一期仅支持 `zh-CN` 和 `en`；语言偏好写入浏览器存储，但不需后端字段或数据库迁移。
- Test/screenshot expectations: 运行格式、单元测试和生产构建；关键编辑路径需手动验证。

## Open questions

- [ ] 后端球员库达到数千人后，是否改为服务端搜索和分页？ owner: 产品 owner; impact: 中
- [ ] 阵容选择器是否需要支持批量加入？ owner: 产品 owner; impact: 低
