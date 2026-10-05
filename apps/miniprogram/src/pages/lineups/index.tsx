import { useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import { validateLineup } from '@dream-court/core';
import { Screen } from '@/components/Screen';
import type { GuestSnapshot, GuestStore } from '@/services/guest-store';
import { prepareIdentifiers } from '@/platform/identifier';
import { navigate } from '@/platform/navigation';
import { errorMessage } from '@/constants/text';

interface LineupsContentProps {
  store: GuestStore;
  data: GuestSnapshot;
}

function LineupsContent({ store, data }: LineupsContentProps) {
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const createLineup = async () => {
    if (creating) return;
    setCreating(true);
    setError('');
    try {
      await prepareIdentifiers();
      const lineup = store.createLineup();
      navigate(`/pages/lineup-editor/index?id=${encodeURIComponent(lineup.id)}`);
    } catch (failure: unknown) {
      setError(errorMessage(failure));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View>
      <Button className="primary" loading={creating} disabled={creating} onClick={createLineup}>
        创建阵容
      </Button>
      {error && <View className="error">{error}</View>}
      {data.lineups.map((lineup) => {
        const validation = validateLineup(lineup);
        return (
          <View className="card" key={lineup.id}>
            <View className="name">{lineup.name}</View>
            <View className="paragraph muted">{lineup.description || '尚未填写描述'}</View>
            <View className="metrics">
              <Text>{lineup.members.length} / 15 人</Text>
              <Text>{validation.activeCount} 名激活</Text>
              <Text>{validation.starterCount} 名首发</Text>
            </View>
            <View className="muted">
              {validation.isEligibleForSimulation ? '可以发起对战' : '需要完成首发配置'}
            </View>
            <Button
              className="secondary"
              onClick={() =>
                navigate(`/pages/lineup-editor/index?id=${encodeURIComponent(lineup.id)}`)
              }
            >
              编辑阵容
            </Button>
          </View>
        );
      })}
    </View>
  );
}

export default function LineupsPage() {
  return (
    <Screen title="我的阵容">
      {(store, data) => <LineupsContent store={store} data={data} />}
    </Screen>
  );
}
