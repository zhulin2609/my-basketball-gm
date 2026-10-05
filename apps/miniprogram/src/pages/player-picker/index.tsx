import { useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Button, View } from '@tarojs/components';
import type { Player } from '@dream-court/core';
import { PlayerBrowser } from '@/components/PlayerBrowser';
import { Screen } from '@/components/Screen';
import {
  addLineupMember,
  loadLineupEditor,
  type GuestSnapshot,
  type GuestStore,
} from '@/services/guest-store';
import { errorMessage } from '@/constants/text';

interface PickerContentProps {
  store: GuestStore;
  data: GuestSnapshot;
  lineupId?: string;
  playerId?: string;
}

function PickerContent({ store, data, lineupId, playerId }: PickerContentProps) {
  const [selectedLineupId, setSelectedLineupId] = useState(lineupId ?? '');
  const readSelection = () => {
    const initial = data.lineups.find((item) => item.id === selectedLineupId);
    return initial ? loadLineupEditor(store, initial) : null;
  };
  const [selection, setSelection] = useState(readSelection);
  const draft = selection?.status === 'ready' ? selection.lineup : null;
  const [error, setError] = useState('');
  const choose = (player: Player) => {
    if (!draft) throw new Error('需要先选择阵容');
    setError('');
    try {
      const next = addLineupMember(draft, player);
      store.saveDraft(next);
      setSelection({ status: 'ready', lineup: next, dirty: true });
    } catch (failure: unknown) {
      setError(errorMessage(failure));
    }
  };

  return (
    <View>
      {!selectedLineupId && (
        <View className="card">
          <View className="paragraph">选择要加入的阵容</View>
          {data.lineups.map((lineup) => (
            <Button
              key={lineup.id}
              className="secondary"
              onClick={() => {
                setSelectedLineupId(lineup.id);
                setSelection(loadLineupEditor(store, lineup));
              }}
            >
              {lineup.name}
            </Button>
          ))}
        </View>
      )}
      {selection?.status === 'failed' && (
        <View>
          <View className="error">无法读取阵容草稿：{errorMessage(selection.error)}</View>
          <Button className="primary" onClick={() => setSelection(readSelection())}>
            重新读取草稿
          </Button>
        </View>
      )}
      {draft && (
        <View>
          <View className="notice">
            {draft.name} · {draft.members.length} / 15 人 · 添加后需要保存阵容
          </View>
          {error && <View className="error">{error}</View>}
          <PlayerBrowser
            players={
              playerId ? data.players.filter((player) => player.id === playerId) : data.players
            }
            selectedIds={draft.members.map((member) => member.playerId)}
            disabled={draft.members.length >= 15}
            onSelect={choose}
          />
          <Button
            className="primary"
            onClick={() => {
              const action = lineupId
                ? Taro.navigateBack()
                : Taro.redirectTo({
                    url: `/pages/lineup-editor/index?id=${encodeURIComponent(draft.id)}`,
                  });
              void action.catch((failure: unknown) => setError(errorMessage(failure)));
            }}
          >
            返回阵容编辑
          </Button>
        </View>
      )}
      {selectedLineupId && !selection && <View className="error">阵容已经无法读取</View>}
    </View>
  );
}

export default function PlayerPickerPage() {
  const { params } = useRouter();
  return (
    <Screen title="选择球员">
      {(store, data) => (
        <PickerContent store={store} data={data} lineupId={params.id} playerId={params.playerId} />
      )}
    </Screen>
  );
}
