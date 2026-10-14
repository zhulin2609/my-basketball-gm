import { useEffect, useState } from 'react';
import { useDidShow, useRouter } from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { selectPlayerOfTheGame, type Simulation } from '@dream-court/core';
import { Screen } from '@/components/Screen';
import { ReportStats } from '@/components/ReportStats';
import { reportTypeLabel } from '@/services/data-store';
import { api, refreshRuntime } from '@/services/runtime';

function ReportContent({ report, showType }: { report: Simulation; showType: boolean }) {
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
        <View className="muted">有效期至 {new Date(report.expiresAt).toLocaleString('zh-CN')}</View>
        {showType && <View className="muted">{reportTypeLabel(report.engineVersion)}</View>}
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
}

/** 账号模式下按 ID 读取战报：列表未覆盖时向服务器查询，过期或无权限返回错误。 */
function AccountReportById({ id }: { id: string }) {
  const [report, setReport] = useState<Simulation | null | 'loading'>('loading');
  useEffect(() => {
    let active = true;
    api
      .getSimulation(id)
      .then((result) => {
        if (active) setReport(result);
      })
      .catch(() => {
        if (active) setReport(null);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (report === 'loading') return <View className="notice">正在读取战报…</View>;
  if (!report) return <View className="error">战报已经到期或无法读取</View>;
  return <ReportContent report={report} showType />;
}

export default function ReportDetailPage() {
  const { params } = useRouter();
  useDidShow(refreshRuntime);
  return (
    <Screen title="比赛战报">
      {(_store, data) => {
        const id = typeof params.id === 'string' ? params.id : '';
        const report = data.reports.find((item) => item.id === id);
        if (report) return <ReportContent report={report} showType={data.source === 'account'} />;
        if (data.source === 'account') return <AccountReportById id={id} />;
        return <View className="error">战报已经到期或无法读取</View>;
      }}
    </Screen>
  );
}
