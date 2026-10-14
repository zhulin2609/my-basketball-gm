import { useDidShow } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { Screen } from '@/components/Screen';
import { reportTypeLabel } from '@/services/data-store';
import { refreshRuntime } from '@/services/runtime';
import { navigate } from '@/platform/navigation';

export default function ReportsPage() {
  useDidShow(refreshRuntime);
  return (
    <Screen title="历史战报">
      {(_store, data) => (
        <View>
          <View className="notice">
            {data.source === 'account'
              ? '战报保存在服务器，创建 30 天后到期。'
              : '战报最多保留 20 场，创建 30 天后到期。'}
          </View>
          {!data.reports.length && <View className="card">还没有有效战报</View>}
          {data.reports.map((report) => (
            <View
              className="card"
              key={report.id}
              onClick={() =>
                navigate(`/pages/report-detail/index?id=${encodeURIComponent(report.id)}`)
              }
            >
              <View className="name">
                {report.homeLineupName} · {report.awayLineupName}
              </View>
              <View className="score">
                {report.homeScore} : {report.awayScore}
              </View>
              <View className="muted">
                <Text>{new Date(report.createdAt).toLocaleString('zh-CN')}</Text>
                {data.source === 'account' && (
                  <Text> · {reportTypeLabel(report.engineVersion)}</Text>
                )}
              </View>
              <Button className="secondary">查看战报</Button>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
