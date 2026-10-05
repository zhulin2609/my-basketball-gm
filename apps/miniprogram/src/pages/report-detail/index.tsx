import { useDidShow, useRouter } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { selectPlayerOfTheGame } from '@dream-court/core';
import { Screen } from '@/components/Screen';
import { ReportStats } from '@/components/ReportStats';
import { refreshRuntime } from '@/services/runtime';

export default function ReportDetailPage() {
  const { params } = useRouter();
  useDidShow(refreshRuntime);
  return (
    <Screen title="比赛战报">
      {(_store, data) => {
        const report = data.reports.find((item) => item.id === params.id);
        if (!report) return <View className="error">战报已经到期或无法读取</View>;
        const best = selectPlayerOfTheGame(report);
        return (
          <View>
            <View className="card score-card">
              <View className="name">
                {report.homeLineupName} · {report.awayLineupName}
              </View>
              <View className="score">
                {report.homeScore} : {report.awayScore}
              </View>
              <View className="muted">{new Date(report.createdAt).toLocaleString('zh-CN')}</View>
              <View className="muted">
                有效期至 {new Date(report.expiresAt).toLocaleString('zh-CN')}
              </View>
            </View>
            {best && (
              <View className="card">
                <Text className="eyebrow">本场最佳球员</Text>
                <View className="name">{best.stat.playerName ?? best.stat.playerId}</View>
                <View className="metrics">
                  <Text>{best.stat.points} 分</Text>
                  <Text>{best.stat.rebounds} 篮板</Text>
                  <Text>{best.stat.assists} 助攻</Text>
                </View>
              </View>
            )}
            <ReportStats name={report.homeLineupName ?? '主队'} stats={report.homeStats} />
            <ReportStats name={report.awayLineupName ?? '客队'} stats={report.awayStats} />
          </View>
        );
      }}
    </Screen>
  );
}
