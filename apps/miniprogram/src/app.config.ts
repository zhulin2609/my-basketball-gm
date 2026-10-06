export default defineAppConfig({
  pages: [
    'pages/players/index',
    'pages/lineups/index',
    'pages/battle/index',
    'pages/account/index',
    'pages/player-detail/index',
    'pages/lineup-editor/index',
    'pages/player-picker/index',
    'pages/reports/index',
    'pages/report-detail/index',
  ],
  window: {
    navigationBarTitleText: 'My Basketball GM',
    navigationBarBackgroundColor: '#102b23',
    navigationBarTextStyle: 'white',
    backgroundColor: '#102b23',
    backgroundTextStyle: 'light',
  },
  // 自定义组件代码按需注入：减少启动时注入的组件代码量（微信代码质量项）。
  lazyCodeLoading: 'requiredComponents',
  tabBar: {
    color: '#b3bcb5',
    selectedColor: '#b9e2ad',
    backgroundColor: '#102b23',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/players/index', text: '球员' },
      { pagePath: 'pages/lineups/index', text: '阵容' },
      { pagePath: 'pages/battle/index', text: '对战' },
      { pagePath: 'pages/account/index', text: '我的' },
    ],
  },
});
