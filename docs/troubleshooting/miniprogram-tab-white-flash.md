# 微信小程序原生 tab 白屏闪烁排查记录

日期：2026-10-13。项目：My Basketball GM。修复提交：`33bf7330c7e2b0caa94224d2e6de5da74e12cc42`。

本次颜色实验确认，iPhone 原生 tab 切换时短暂显示的白色区域来自页面容器背景。九个页面显式设置 `backgroundColorContent: '#102b23'` 后，真机过渡采样未再捕获白色画面，用户确认普通预览首次及重复切换均没有白色闪烁。四个原生 tab 和九个页面路径保持原有实现。

## 复现环境与现象

| 项目               | 本次记录                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| 手机               | iPhone 14 Pro Max                                                                |
| 系统               | iOS 26.6.2                                                                       |
| 微信               | 8.0.79                                                                           |
| 真机基础库         | 3.17.4，官方自动化接口返回 `platform: ios`                                       |
| 微信开发者工具     | 2.02.2608080                                                                     |
| 小程序框架         | Taro 4.3.0、React 18.3.1，WebView 渲染                                           |
| 自动化依赖         | miniprogram-automator 0.12.1、jpeg-js 0.3.7                                      |
| 导航               | 球员、阵容、对战、我的，四个原生 tab                                             |
| 业务代码基线       | `52a8030a27a7a4eb11b29cfee80caecd8e7b7ff0`；继续定位时已有 PageMeta 背景配置修改 |
| 项目最低基础库声明 | 3.17.3；与本次真机实际使用版本分别记录                                           |

设备和版本来自当时的真机接口与开发者工具显示。版本号用于描述这次复现条件。

白色闪烁同时出现在首次打开和重复切换已打开的 tab。导航栏与底部 tabBar 保持深绿色，中间内容区域短暂整块变白，随后恢复正常内容。普通预览也能复现，调试浮层没有构成复现的必要条件。

用户录屏 `ScreenRecording_10-13-2026 14-40-18_1.MP4` 长约 9.24 秒。解码得到 553 帧，其中 19 帧达到内容区域白色判定阈值，分为 13 段，每段连续 1–4 帧，约 16–67ms。抽取异常帧及相邻帧进行视觉核对，确认白色集中于内容区域。

## 三层背景与相关配置

微信官方的 [WebView 下的页面背景色](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/custom-route#webview-下的页面背景色) 将背景分为三层。该章节位于 Skyline 文档路径下，正文明确说明 WebView 的行为。

| 层级         | 配置入口                                              | 官方描述的 WebView 默认值 | 本项目设置 |
| ------------ | ----------------------------------------------------- | ------------------------- | ---------- |
| 页面背景     | WXSS 的 `page` 选择器                                 | 透明                      | `#102b23`  |
| 页面容器背景 | 各页面 JSON 的 `backgroundColorContent`               | 白色                      | `#102b23`  |
| 窗口背景     | 页面配置 `backgroundColor` 或 `wx.setBackgroundColor` | 白色                      | `#102b23`  |

WebView 的 `backgroundColorContent` 使用 `#RRGGBB`。本次配置写入各页面 JSON；[官方页面配置表](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html) 列出了该字段，但没有给出最低基础库版本。

[`page-meta`](https://developers.weixin.qq.com/miniprogram/dev/component/page-meta.html) 的 `root-background-color` 对应 Taro 的 `rootBackgroundColor`，官方描述为页面内容背景色，覆盖页面空白部分及 resize 动画期间的临时空闲区域。`page-meta` 必须位于页面第一个节点；`root-background-color` 属性的最低基础库为 2.12.1。项目通过 `enablePageMeta: true` 和公共 `Screen` 组件启用该配置。

官方资料没有明确给出 `rootBackgroundColor` 与 `backgroundColorContent` 的底层映射、覆盖顺序或等价关系。本次实测确认：已有 PageMeta 配置时仍会白闪；单独修改页面 JSON 的 `backgroundColorContent`，过渡区域随之变成指定颜色。

`backgroundColorTop` 和 `backgroundColorBottom` 控制顶部、底部窗口背景，仅 iOS 支持。它们与导航栏、tabBar 的颜色分别配置。上述官方说明定义了配置职责；本次颜色实验提供了切换白色区域来源的证据。

## 定位实验与证据

### 页面实例和现有背景

真实 iPhone 两轮四 tab 切换中，页面 ID、PageMeta 节点标识及根子节点数量保持稳定，PageMeta 数据中的背景值为 `#102b23`，没有收到运行异常。业务代码检查没有发现切换 tab 时清空页面的路径。

官方 CDP 接口中的四个页面宿主背景均为 `rgb(16, 43, 35)`。该接口返回合成组件树，不能将这些值作为真实 HTML/body 计算样式的证据。节点存在、配置正确和切换结束后的页面完整，只能说明对应时刻的状态。

### 缩小复现范围

| 实验                  | 保持或改变的条件                                                   | 观测结果                                 | 本次能够支持的判断                      |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------- | --------------------------------------- |
| PageMeta 窗口背景实验 | 为现有 PageMeta 增加窗口及顶部、底部背景属性                       | 用户仍观察到白闪                         | 这些配置不足以消除本次白闪              |
| 内容容器样式实验      | 四页 `.screen` 临时增加不透明深色背景和 `min-height: 100vh`        | 32 次截图中 9 张达到白色阈值             | 内容容器样式未覆盖当前过渡画面          |
| 普通预览              | 在同一 iPhone 打开官方预览包                                       | 用户确认仍闪白                           | 问题也存在于普通预览                    |
| 原生静态基线          | 四个原生 tab、静态文字、深色 page CSS 和 page-meta                 | 32 次截图中 2 张白色画面                 | 复现不依赖 Taro、业务加载或用户存储操作 |
| 页面容器颜色实验      | 原生静态项目只增加四页 JSON 的 `backgroundColorContent: '#ff00ff'` | 32 次截图中 2 张洋红色画面、0 张白色画面 | 暴露区域的颜色由页面容器背景控制        |

两组业务内存实验结束后恢复临时属性和样式。原生项目使用独立目录与自动化端口，避免影响原开发窗口及用户存储。

原生基线的白色样本为零起始 `index` 17、18，均发生在重复切换中。洋红色样本为零起始 `index` 14、28。视觉检查确认两组样本的变化区域一致：内容区域整体改变颜色，导航栏与 tabBar 保持深绿色。

颜色实验将背景字段与实际过渡画面联系起来，定位到可配置的页面容器层。本次没有进一步确定微信客户端在这些切换时刻展示容器背景的内部绘制原因，也没有据此断言某个微信版本存在已知缺陷。

### 原生静态复现的必要内容

在独立诊断项目中，使用 `App({})`，注册四个页面并配置原生 `tabBar`。各页面使用 `Page({})`，仅渲染静态文字，避免引入网络请求、业务状态和存储操作。导航栏、窗口和 tabBar 背景均设置为 `#102b23`。

四页 WXML 结构相同，文字分别标识当前 tab：

```xml
<page-meta
  background-color="#102b23"
  background-color-top="#102b23"
  background-color-bottom="#102b23"
  root-background-color="#102b23"
/>
<view class="screen">原生静态页面：球员</view>
```

公共 WXSS：

```css
page {
  background: #102b23;
  color: #f2efdc;
  font-size: 32rpx;
}

.screen {
  padding: 40rpx;
}
```

基线不声明 `backgroundColorContent`。确认基线能够复现后，仅给四个页面的 JSON 增加以下配置，重新编译并连接同一台手机：

```json
{
  "backgroundColorContent": "#ff00ff"
}
```

记录过渡区域是否随定位颜色变化。颜色实验结束后，业务配置使用产品背景色。

## 修复实现

九个 `apps/miniprogram/src/pages/*/index.config.ts` 均显式设置页面容器背景。以[球员页面配置](../../apps/miniprogram/src/pages/players/index.config.ts)为例：

```ts
export default definePageConfig({
  enablePageMeta: true,
  backgroundColor: '#102b23',
  backgroundColorContent: '#102b23',
  backgroundColorTop: '#102b23',
  backgroundColorBottom: '#102b23',
  backgroundTextStyle: 'light',
});
```

配置覆盖 `players`、`lineups`、`battle`、`account`、`player-detail`、`lineup-editor`、`player-picker`、`reports`、`report-detail`。构建后核验对应九个 `dist/pages/*/index.json`，确认字段全部写入产物。

[`app.css`](../../apps/miniprogram/src/app.css) 保留深绿色 `page` 背景；[`Screen.tsx`](../../apps/miniprogram/src/components/Screen.tsx) 在首个节点声明 `PageMeta rootBackgroundColor="#102b23"`，并配置原有导航栏颜色。关键修复是页面 JSON 中新增的 `backgroundColorContent`。本次继续使用原生 tab 和各自独立页面，导航路径、业务数据及保存语义保持一致。

后续新增同类深色页面时，应同时检查源配置与构建产物中的页面容器背景。

## 修复后验证

以下结果来自 2026-10-13 对本次修复的实际验证；本次文档整理仅复核证据，未重新执行设备测试。

| 验证                      | 结果与范围                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| 业务版本原生 tab 连续切换 | iPhone 64 次切换、64 张截图，0 张白色、0 张洋红色；异常事件为空，每次切换后的页面路径符合预期         |
| 滚动与独立页面返回        | 16 次过渡采样，0 张白色截图；覆盖球员详情、现有阵容编辑、球员选择、历史战报及有效战报详情的进入和返回 |
| 滚动位置                  | 球员列表滚动到 600px，切换 tab 再返回仍为 600px                                                       |
| 业务存储                  | 页面流程测试前后，游客工作区和草稿存储的 SHA-256 一致                                                 |
| 普通预览                  | 同一 iPhone、没有调试连接浮层；用户首次及重复切换四个 tab 后确认“没有白色闪烁”                        |
| 自动化测试                | `npm test -- --maxWorkers=1`：21 个文件、101 项测试通过                                               |
| 类型与构建                | `npm run build:weapp`、`npm run build` 通过，均包含四包 typecheck；九份页面 JSON 已核验               |
| 格式与差异                | `npm run format:check`、`git diff --check` 通过                                                       |

两组修复后真机采样共 80 张截图，均未捕获白色画面。页面流程使用设备上已有的阵容和有效战报，完成后恢复 `setKeepScreenOn: false`。

本次真机实际基础库为 3.17.4。Android 没有可用设备；最低声明版本 3.17.3 的这项修复也未完成真机复验。阶段 3 其余验收仍按 [current.md](../plans/current.md) 的 Remaining Product Work 跟踪。

页面流程脚本需要设备上已有无草稿的阵容和有效战报。缺少对应数据时，该项应记录为 NOT RUN，不能沿用本次完整流程通过的结果。

## 采样方法与证据边界

录屏和截图均取画面横向 10%–90%、纵向 20%–80% 的区域，每隔 4 个像素采样。单点 RGB 三个通道均大于 235 时计为白色点；白色点占比大于 80% 时标记为白色候选帧。颜色实验另将 R、B 大于 235 且 G 小于 40 的点计为洋红色点，并使用相同占比阈值。

该阈值针对本项目深色内容区域，需结合候选帧及相邻帧的视觉核对使用。浅色产品界面、系统弹窗或取样区域变化都可能改变判定含义。

早期一次官方真机截图请求耗时 1263ms；修复后业务版本 64 次采样从发起切换到截图返回耗时 486–1682ms。用户录屏中的白色片段按帧时间估算持续约 16–67ms。脚本在 `wx.switchTab` 发起后，以 0/8/16/33ms 的轮换延迟请求截图，两个请求并发进行。延迟描述的是请求发送时机，不能当作实际截图时间；返回画面可能来自切换前、过渡中或切换后。

本次使用的 `miniprogram-automator` 高层 `switchTab()` 内部等待约 3000ms，再返回当前页面。它适合检查切换完成后的页面，无法承担本次过渡采样。因此采样使用 `mini.callWxMethod('switchTab', { url })` 与截图并发发起，并在操作后核验实际路径。

各组截图计数不能直接作为故障发生率，也不能通过 2/32 与 9/32 判断故障改善程度。零白色样本表明本组采样没有捕获白闪，完整结论同时依赖原生复现、颜色实验和普通预览的连续人工观察。

另外，官方自动化 `page.scrollTop()` 在本次真机上返回 0，而原生 `wx.createSelectorQuery().selectViewport().scrollOffset()` 返回 600，截图也确认页面已经滚动。滚动保持的断言使用原生接口数据。

## 可复用的排查步骤

1. **记录可见现象。** 保存包含首次及重复切换的真机录屏，区分导航栏、tabBar 与内容区域，记录设备、微信和实际基础库版本。
2. **建立能够观察失败的验证。** 解码录屏并检查异常帧；自动截图先在有问题的版本捕获失败样本，确认采样方法能触达过渡时刻。
3. **检查页面生命周期和内容。** 核验页面标识、关键节点、数据更新和运行异常；分别记录切换中的画面与切换完成后的状态。
4. **比较调试与普通预览。** 使用同一设备和对应构建，确认现象是否依赖调试环境。
5. **制作原生最小复现。** 使用独立项目保留相同原生 tab 结构、静态内容和背景配置，核验问题是否仍然出现。保护原项目存储，检查自动化端口及返回的 `platform`，避免把模拟器结果记为真机结果。
6. **逐层进行颜色实验。** 根据官方配置职责，每次只改变一个背景层的定位颜色；观察异常区域是否随之变色，并保存样本和配置差异。
7. **验证源配置、构建产物和实际页面。** 将确定的字段设置为产品颜色，核对所有相关页面 JSON；运行项目测试、typecheck 和构建，再检查真实设备的导航与返回行为。
8. **完成普通预览验证。** 覆盖首次、重复和滚动后切换，结合录屏或现场观察确认短暂闪烁；记录设备与版本范围，并恢复诊断期间修改的设置。

## 本地证据索引

以下文件位于 Git 忽略目录 `.cache/tab-flash-followup/`。它们用于本次复核，不随仓库提交交付；新的检出环境应按照上面的步骤重新产生证据。本文保存统计、必要配置、实验条件和判定方法，避免长期记录仅依赖本地路径。

| 相对该目录的路径                                                                                      | 内容                                      |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `video/frames.json`、`video/*.png`                                                                    | 原录屏逐帧时间与白色占比、抽取的相邻画面  |
| `runtime.json`、`root-style.json`                                                                     | 页面实例与节点记录、CDP 页面宿主样式      |
| `capture-screen.json`                                                                                 | 内容容器样式实验，32 次采样、9 张白色截图 |
| `capture-native.json`、`native-white-17.jpg`、`native-white-18.jpg`                                   | 原生基线的采样数据与白色画面              |
| `capture-native-magenta.json`、`native-magenta-transition-14.jpg`、`native-magenta-transition-28.jpg` | 页面容器颜色实验的数据与画面              |
| `capture-fixed.json`                                                                                  | 修复后业务版本 64 次切换采样              |
| `verify-fixed-pages.json`、`fixed-pages-*.jpg`                                                        | 16 次页面流程采样、滚动与存储检查结果     |
| `analyze.swift`、`capture.cjs`、`verify-fixed-pages.cjs`                                              | 当次录屏检测、真机采样和页面验证脚本      |

原生诊断和业务复验项目也保存在该忽略目录。本地项目配置与二维码不作为文档附件。
