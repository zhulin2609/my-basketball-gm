import { useDidShow } from '@tarojs/taro';
import { Button, View } from '@tarojs/components';
import { Screen } from '@/components/Screen';
import { refreshRuntime } from '@/services/runtime';
import { navigate } from '@/platform/navigation';

export default function ReportsPage() {
  useDidShow(refreshRuntime);
  return (
    <Screen title="历史战报">
      {(_store, data) => (
        <View>
          <View className="notice">战报最多保留 20 场，创建 30 天后到期。</View>
          {!data.reports.length && <View className="card">还没有有效战报</View>}
          {data.reports.map((report) => (
            <View className="card" key={report.id}>
              <View className="name">
                {report.homeLineupName} · {report.awayLineupName}
              </View>
              <View className="score">
                {report.homeScore} : {report.awayScore}
              </View>
              <View className="muted">{new Date(report.createdAt).toLocaleString('zh-CN')}</View>
              <Button
                className="secondary"
                onClick={() =>
                  navigate(`/pages/report-detail/index?id=${encodeURIComponent(report.id)}`)
                }
              >
                查看战报
              </Button>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
