import { useEffect, useRef, useState } from 'react';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { Button, Input, Picker, Switch, Text, Textarea, View } from '@tarojs/components';
import {
  displayPlayerName,
  STARTER_POSITIONS,
  validateLineup,
  type Lineup,
  type LineupMember,
  type Player,
} from '@dream-court/core';
import { Screen } from '@/components/Screen';
import {
  changeLineupMember,
  loadLineupEditor,
  removeLineupMember,
  type GuestStore,
} from '@/services/guest-store';
import { errorMessage } from '@/constants/text';
import { navigate } from '@/platform/navigation';

interface EditorProps {
  store: GuestStore;
  initial: Lineup;
  players: Player[];
}

function LineupEditor({ store, initial, players }: EditorProps) {
  const [editor, setEditor] = useState(() => loadLineupEditor(store, initial));
  const dirty = editor.status === 'ready' && editor.dirty;
  const [error, setError] = useState('');
  const [status, setStatus] = useState(dirty ? '已恢复草稿，请完成保存' : '已保存到本机');
  const draftWriteFailed = useRef(false);

  const reload = () => {
    const loaded = loadLineupEditor(store, initial);
    setEditor(loaded);
    if (loaded.status === 'ready') {
      setStatus(loaded.dirty ? '已恢复草稿，请完成保存' : '已保存到本机');
      setError('');
    }
  };

  useDidShow(() => {
    if (draftWriteFailed.current) return;
    reload();
  });

  useEffect(() => {
    const updateAlert = async () => {
      if (dirty) {
        await Taro.enableAlertBeforeUnload({
          message: '阵容仍有未保存内容，返回后可以恢复草稿。',
        });
      } else {
        await Taro.disableAlertBeforeUnload();
      }
    };
    void updateAlert().catch((failure: unknown) => setError(errorMessage(failure)));
  }, [dirty]);

  if (editor.status === 'failed') {
    return (
      <View>
        <View className="error">无法读取阵容草稿：{errorMessage(editor.error)}</View>
        <Button className="primary" onClick={reload}>
          重新读取草稿
        </Button>
      </View>
    );
  }

  const { lineup } = editor;
  const validation = validateLineup(lineup);

  const edit = (updated: Lineup) => {
    setEditor({ status: 'ready', lineup: updated, dirty: true });
    setError('');
    try {
      store.saveDraft(updated);
      draftWriteFailed.current = false;
      setStatus('草稿已保存到本机，尚未用于对战');
    } catch (failure: unknown) {
      draftWriteFailed.current = true;
      setStatus('草稿写入失败，请保留当前页面');
      setError(errorMessage(failure));
    }
  };

  const updateMember = (playerId: string, changes: Partial<LineupMember>) => {
    edit(changeLineupMember(lineup, playerId, changes));
  };

  const save = () => {
    setError('');
    try {
      store.saveLineup(lineup);
      draftWriteFailed.current = false;
      setEditor({ status: 'ready', lineup, dirty: false });
      setStatus('已保存到本机');
    } catch (failure: unknown) {
      setStatus('尚未保存成功');
      setError(errorMessage(failure));
    }
  };

  return (
    <View>
      <View className="card">
        <View className="label">阵容名称</View>
        <Input
          className="input"
          value={lineup.name}
          maxlength={120}
          placeholder="填写阵容名称"
          onInput={(event) => edit({ ...lineup, name: event.detail.value })}
        />
        <View className="label">阵容描述</View>
        <Textarea
          className="input textarea"
          value={lineup.description}
          maxlength={1000}
          placeholder="填写阵容描述"
          autoHeight
          onInput={(event) => edit({ ...lineup, description: event.detail.value })}
        />
        <View className="notice">{status}</View>
        {error && <View className="error">{error}</View>}
        <Button className="primary" onClick={save} disabled={!dirty}>
          保存阵容
        </Button>
      </View>
      <View className="card">
        <View className="metrics">
          <Text>{lineup.members.length} / 15 人</Text>
          <Text>{validation.activeCount} / 13 名激活</Text>
          <Text>{validation.starterCount} / 5 名首发</Text>
        </View>
        <View className="muted">
          {validation.isEligibleForSimulation
            ? '首发配置符合对战要求'
            : `首发需要覆盖五个位置；缺少：${validation.missingStarterPositions.join('、') || '请检查人数和重复位置'}`}
        </View>
        <Button
          className="secondary"
          disabled={lineup.members.length >= 15}
          onClick={() => {
            try {
              if (dirty) {
                store.saveDraft(lineup);
                draftWriteFailed.current = false;
              }
              navigate(`/pages/player-picker/index?id=${encodeURIComponent(lineup.id)}`);
            } catch (failure: unknown) {
              setError(errorMessage(failure));
            }
          }}
        >
          添加球员
        </Button>
      </View>
      {lineup.members.map((member) => {
        const player = players.find((item) => item.id === member.playerId);
        if (!player) throw new Error(`无法读取阵容球员：${member.playerId}`);
        return (
          <View className="card" key={member.playerId}>
            <View className="name">{displayPlayerName(player, 'zh-CN')}</View>
            <View className="filters">
              <Picker
                range={STARTER_POSITIONS}
                value={STARTER_POSITIONS.indexOf(member.position)}
                onChange={(event) =>
                  updateMember(member.playerId, {
                    position: STARTER_POSITIONS[Number(event.detail.value)],
                  })
                }
              >
                <View className="select">位置：{member.position}</View>
              </Picker>
              <View className="toggle">
                <Text>首发</Text>
                <Switch
                  color="#8bbf80"
                  checked={member.starter}
                  disabled={member.inactive || (!member.starter && validation.starterCount >= 5)}
                  onChange={(event) =>
                    updateMember(member.playerId, { starter: event.detail.value })
                  }
                />
              </View>
              <View className="toggle">
                <Text>激活</Text>
                <Switch
                  color="#8bbf80"
                  checked={!member.inactive}
                  disabled={member.inactive && validation.activeCount >= 13}
                  onChange={(event) =>
                    updateMember(member.playerId, {
                      inactive: !event.detail.value,
                      starter: event.detail.value ? member.starter : false,
                    })
                  }
                />
              </View>
            </View>
            <Button
              size="mini"
              className="secondary"
              onClick={() => edit(removeLineupMember(lineup, player.id))}
            >
              移除球员
            </Button>
          </View>
        );
      })}
    </View>
  );
}

export default function LineupEditorPage() {
  const { params } = useRouter();
  return (
    <Screen title="编辑阵容">
      {(store, data) => {
        const initial = data.lineups.find((lineup) => lineup.id === params.id);
        return initial ? (
          <LineupEditor key={initial.id} store={store} initial={initial} players={data.players} />
        ) : (
          <View className="error">阵容已经无法读取</View>
        );
      }}
    </Screen>
  );
}
