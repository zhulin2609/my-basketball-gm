import { useEffect, useRef, useState } from 'react';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { Button, Input, Picker, Text, Textarea, View } from '@tarojs/components';
import {
  displayPlayerName,
  STARTER_POSITIONS,
  validateLineup,
  type Lineup,
  type LineupMember,
  type Player,
} from '@dream-court/core';
import { Screen } from '@/components/Screen';
import { LineupMemberSwitch } from '@/components/LineupMemberSwitch';
import {
  changeLineupMember,
  getLineupMembersForDisplay,
  getLineupStarterIds,
  loadLineupEditor,
  removeLineupMember,
  setLineupMemberToggle,
  type LineupMemberToggle,
} from '@/services/guest-store';
import type { DataSnapshot, DataStore } from '@/services/data-store';
import { errorMessage } from '@/constants/text';
import { navigate } from '@/platform/navigation';

interface EditorProps {
  store: DataStore;
  source: DataSnapshot['source'];
  initial: Lineup;
  players: Player[];
}

function LineupEditor({ store, source, initial, players }: EditorProps) {
  const [editor, setEditor] = useState(() => loadLineupEditor(store, initial));
  const [starterIds, setStarterIds] = useState(() =>
    editor.status === 'ready' ? getLineupStarterIds(editor.lineup) : new Set<string>(),
  );
  const dirty = editor.status === 'ready' && editor.dirty;
  const savedText = source === 'account' ? '已保存到账号' : '已保存到本机';
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [memberFeedback, setMemberFeedback] = useState<{ playerId: string; message: string }>();
  const [status, setStatus] = useState(dirty ? '有草稿未保存' : savedText);
  const draftWriteFailed = useRef(false);
  // Hook 必须在所有条件返回之前调用，保持每次渲染的调用顺序一致。
  const latestLineup = useRef<Lineup | null>(null);

  const reload = () => {
    const loaded = loadLineupEditor(store, initial);
    setEditor(loaded);
    if (loaded.status === 'ready') {
      setStarterIds(getLineupStarterIds(loaded.lineup));
      setStatus(loaded.dirty ? '有草稿未保存' : savedText);
      setError('');
      setMemberFeedback(undefined);
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
  latestLineup.current = lineup;

  const edit = (updated: Lineup) => {
    setEditor({ status: 'ready', lineup: updated, dirty: true });
    setError('');
    setMemberFeedback(undefined);
    try {
      store.saveDraft(updated);
      draftWriteFailed.current = false;
      setStatus('有草稿未保存');
    } catch (failure: unknown) {
      draftWriteFailed.current = true;
      setStatus('草稿写入失败，请保留当前页面');
      setError(errorMessage(failure));
    }
  };

  const updateMember = (playerId: string, changes: Partial<LineupMember>) => {
    edit(changeLineupMember(lineup, playerId, changes));
  };

  const toggleMember = (
    playerId: string,
    toggle: LineupMemberToggle,
    enabled: boolean,
  ): boolean => {
    const result = setLineupMemberToggle(lineup, playerId, toggle, enabled);
    if (result.status === 'unchanged') return true;
    if (result.status === 'blocked') {
      setMemberFeedback({ playerId, message: result.message });
    } else {
      edit(result.lineup);
    }
    if (result.toast) {
      void Taro.showToast({ title: result.toast, icon: 'none' }).catch((failure: unknown) =>
        setError(errorMessage(failure)),
      );
    }
    return result.status === 'changed';
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const submitted = lineup;
    try {
      await store.saveLineup(submitted);
      draftWriteFailed.current = false;
      // 保存期间产生的新编辑保留为未保存草稿，只有内容未变时才显示保存成功。
      if (latestLineup.current === submitted) {
        setEditor({ status: 'ready', lineup: submitted, dirty: false });
        setStatus(savedText);
      } else {
        setStatus('有草稿未保存');
      }
      setMemberFeedback(undefined);
    } catch (failure: unknown) {
      setStatus('尚未保存成功');
      setError(errorMessage(failure));
    } finally {
      setSaving(false);
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
        <View className={dirty ? 'notice draft-warning' : 'notice'}>{status}</View>
        {error && <View className="error">{error}</View>}
        <Button
          className="primary"
          onClick={() => void save()}
          disabled={!dirty || saving}
          loading={saving}
        >
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
      {getLineupMembersForDisplay(lineup, starterIds).map((member) => {
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
                <LineupMemberSwitch
                  checked={member.starter}
                  onChange={(enabled) => toggleMember(member.playerId, 'starter', enabled)}
                />
              </View>
              <View className="toggle">
                <Text>激活</Text>
                <LineupMemberSwitch
                  checked={!member.inactive}
                  onChange={(enabled) => toggleMember(member.playerId, 'active', enabled)}
                />
              </View>
            </View>
            {memberFeedback?.playerId === member.playerId && (
              <View className="notice draft-warning">{memberFeedback.message}</View>
            )}
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
          <LineupEditor
            key={initial.id}
            store={store}
            source={data.source}
            initial={initial}
            players={data.players}
          />
        ) : (
          <View className="error">阵容已经无法读取</View>
        );
      }}
    </Screen>
  );
}
