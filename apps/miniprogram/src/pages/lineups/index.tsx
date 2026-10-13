import { useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import { validateLineup } from '@dream-court/core';
import { Screen } from '@/components/Screen';
import { loadLineupEditor, type GuestSnapshot, type GuestStore } from '@/services/guest-store';
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
        const draft = loadLineupEditor(store, lineup);
        const hasDraft = draft.status === 'ready' && draft.dirty;
        return (
          <View
            className="card"
            key={lineup.id}
            onClick={() =>
              navigate(`/pages/lineup-editor/index?id=${encodeURIComponent(lineup.id)}`)
            }
          >
            <View className="name">{lineup.name}</View>
            <View className="paragraph muted">{lineup.description || '尚未填写描述'}</View>
            {hasDraft && <View className="notice draft-warning">有草稿未保存</View>}
            <View className="metrics">
              {hasDraft && <Text>已保存阵容：</Text>}
              <Text>{lineup.members.length} / 15 人</Text>
              <Text>{validation.activeCount} 名激活</Text>
              <Text>{validation.starterCount} 名首发</Text>
            </View>
            <View className="muted">
              {draft.status === 'failed' ? (
                <Text className="error">无法读取阵容草稿：{errorMessage(draft.error)}</Text>
              ) : hasDraft ? (
                '请先保存阵容，再发起对战'
              ) : validation.isEligibleForSimulation ? (
                '可以发起对战'
              ) : (
                '需要完成首发配置'
              )}
            </View>
            <Button className="secondary">编辑阵容</Button>
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
