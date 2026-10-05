import { Button, View } from '@tarojs/components';
import { Screen } from '@/components/Screen';
import { navigate } from '@/platform/navigation';

export default function AccountPage() {
  return (
    <Screen title="我的">
      {(_store, data) => (
        <View>
          <View className="card">
            <View className="name">游客工作区</View>
            <View className="paragraph">
              阵容和战报保存在当前设备，关闭后重新打开可以继续使用。
            </View>
            <View className="metrics">
              <View>{data.lineups.length} 套阵容</View>
              <View>{data.reports.length} 场有效战报</View>
            </View>
            <View className="muted">
              {data.hasUserProgress ? '已有个人进度' : '当前使用内置示例'}
            </View>
            <Button className="secondary" onClick={() => navigate('/pages/reports/index')}>
              查看历史战报
            </Button>
          </View>
          <View className="card muted">篮球模拟工具，球员能力用于游戏规则计算。</View>
        </View>
      )}
    </Screen>
  );
}
