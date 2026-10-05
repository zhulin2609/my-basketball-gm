import { useState } from 'react';
import { Button, Picker, View } from '@tarojs/components';
import { validateLineup } from '@dream-court/core';
import { Screen } from '@/components/Screen';
import type { GuestSnapshot, GuestStore } from '@/services/guest-store';
import { prepareIdentifiers } from '@/platform/identifier';
import { navigate } from '@/platform/navigation';
import { errorMessage } from '@/constants/text';

interface BattleContentProps {
  store: GuestStore;
  data: GuestSnapshot;
}

function BattleContent({ store, data }: BattleContentProps) {
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const home = data.lineups.find((lineup) => lineup.id === homeId) ?? data.lineups[0];
  const opponents = data.lineups.filter((lineup) => lineup.id !== home?.id);
  const away = opponents.find((lineup) => lineup.id === awayId) ?? opponents[0];
  const eligible =
    home && away && [home, away].every((lineup) => validateLineup(lineup).isEligibleForSimulation);

  const run = async () => {
    if (running || !home || !away) return;
    setRunning(true);
    setError('');
    try {
      await prepareIdentifiers();
      const report = store.runBattle(home.id, away.id);
      navigate(`/pages/report-detail/index?id=${encodeURIComponent(report.id)}`);
    } catch (failure: unknown) {
      setError(errorMessage(failure));
    } finally {
      setRunning(false);
    }
  };

  return (
    <View>
      <View className="card">
        <View className="label">主队</View>
        <Picker
          range={data.lineups.map((lineup) => lineup.name)}
          value={Math.max(
            0,
            data.lineups.findIndex((lineup) => lineup.id === home?.id),
          )}
          disabled={running}
          onChange={(event) => setHomeId(data.lineups[Number(event.detail.value)].id)}
        >
          <View className="select">{home?.name ?? '需要创建阵容'}</View>
        </Picker>
        <View className="label">客队</View>
        <Picker
          range={opponents.map((lineup) => lineup.name)}
          value={Math.max(
            0,
            opponents.findIndex((lineup) => lineup.id === away?.id),
          )}
          disabled={running || !opponents.length}
          onChange={(event) => setAwayId(opponents[Number(event.detail.value)].id)}
        >
          <View className="select">{away?.name ?? '需要另一套阵容'}</View>
        </Picker>
        <View className="notice">规则引擎在设备上计算，结果保存到本机游客工作区。</View>
        {[home, away].map((lineup) => {
          if (!lineup) return null;
          const validation = validateLineup(lineup);
          return (
            <View className="paragraph muted" key={lineup.id}>
              {lineup.name}：
              {validation.isEligibleForSimulation
                ? '可以对战'
                : `需要五名首发，覆盖全部位置；缺少 ${validation.missingStarterPositions.join('、') || '有效首发配置'}`}
            </View>
          );
        })}
        {error && <View className="error">{error}</View>}
        <Button className="primary" loading={running} disabled={running || !eligible} onClick={run}>
          {running ? '正在模拟比赛' : '开始规则对战'}
        </Button>
      </View>
      <Button className="secondary" onClick={() => navigate('/pages/reports/index')}>
        查看历史战报
      </Button>
    </View>
  );
}

export default function BattlePage() {
  return (
    <Screen title="梦幻对战">{(store, data) => <BattleContent store={store} data={data} />}</Screen>
  );
}
