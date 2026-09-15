import { useMemo, useState, type ReactNode } from 'react';
import {
  bootstrapLineups,
  lineupRepository,
  listPlayers,
  playerRepository,
  simulationRepository,
} from '@/lib/repository';
import { STARTER_POSITIONS, validateLineup } from '@/lib/lineup-validation';
import { simulate } from '@/lib/simulator';
import type { Lineup, LineupMember, Player, Position, Ratings, Simulation } from '@/types';

type View = 'players' | 'lineups' | 'battle';

// 位置是阵容条目的属性，而不是球员的固定属性：同一球员在不同阵容中可打不同位置。
const positions = STARTER_POSITIONS;
const starterDisplayOrder: Position[] = ['C', 'PF', 'SF', 'SG', 'PG'];

interface RatingField {
  key: keyof Ratings;
  label: string;
}

const ratingFields: RatingField[] = [
  { key: 'threePoint', label: '三分' },
  { key: 'layup', label: '上篮' },
  { key: 'midRange', label: '中投' },
  { key: 'insideScoring', label: '内线进攻' },
  { key: 'dunk', label: '扣篮' },
  { key: 'offensiveRebound', label: '进攻篮板' },
  { key: 'defensiveRebound', label: '防守篮板' },
  { key: 'handling', label: '运球' },
  { key: 'passing', label: '传球' },
  { key: 'defensiveIQ', label: '防守意识' },
  { key: 'offensiveIQ', label: '进攻意识' },
  { key: 'block', label: '盖帽' },
  { key: 'steal', label: '抢断' },
  { key: 'freeThrow', label: '罚篮' },
  { key: 'speed', label: '速度' },
  { key: 'agility', label: '敏捷' },
  { key: 'strength', label: '力量' },
  { key: 'vertical', label: '弹跳' },
  { key: 'stamina', label: '耐力' },
  { key: 'shotTendency', label: '投篮倾向' },
];

const defaultRatings: Ratings = {
  threePoint: 75,
  layup: 75,
  midRange: 75,
  insideScoring: 75,
  dunk: 75,
  offensiveRebound: 75,
  defensiveRebound: 75,
  handling: 75,
  passing: 75,
  defensiveIQ: 75,
  offensiveIQ: 75,
  speed: 75,
  agility: 75,
  vertical: 75,
  strength: 75,
  freeThrow: 75,
  steal: 75,
  block: 75,
  stamina: 75,
  shotTendency: 75,
};

// 首次加载时从本地存储取回阵容；没有存档时 repository 会写入两套可直接试玩的示例阵容。
const initialLineups = bootstrapLineups();

// V1 的综合能力仅用于列表排序和展示，不参与比赛引擎的具体计算。
const average = (p: Player) =>
  Math.round(
    (p.threePoint +
      p.layup +
      p.midRange +
      p.insideScoring +
      p.dunk +
      p.offensiveRebound +
      p.defensiveRebound +
      p.handling +
      p.passing +
      p.defensiveIQ +
      p.offensiveIQ) /
      11,
  );
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface PlayerLibraryProps {
  players: Player[];
  onAdd: (player: Player) => void;
  onSavePlayer: (player: Player) => void;
  onOpenLineup: () => void;
}

interface PlayerDetailProps {
  player: Player;
  onAdd: () => void;
  onEdit: () => void;
}

interface PlayerEditorProps {
  player: Player;
  onCancel: () => void;
  onSave: (player: Player) => void;
}

interface LineupWorkbenchProps {
  players: Player[];
  lineups: Lineup[];
  selected: Lineup;
  onSelect: (lineup: Lineup) => void;
  onSave: (lineup: Lineup) => void;
  onNew: () => void;
  onPlay: (home: Lineup, away: Lineup) => void;
}

interface BattleProps {
  players: Player[];
  lineups: Lineup[];
  game: Simulation | null;
  onPlay: (home: Lineup, away: Lineup) => void;
}

interface GameResultProps {
  game: Simulation;
  home: Lineup;
  away: Lineup;
  players: Player[];
}

interface StatTableProps {
  name: string;
  rows: ReactNode;
}

export function App() {
  // App 只保存跨页面共享的状态；各页面组件只通过回调修改这些状态。
  const [view, setView] = useState<View>('players');
  const [lineups, setLineups] = useState<Lineup[]>(initialLineups);
  const [players, setPlayers] = useState<Player[]>(listPlayers);
  const [selected, setSelected] = useState<Lineup>(initialLineups[0]);
  const [game, setGame] = useState<Simulation | null>(simulationRepository.list()[0] ?? null);
  // 阵容的唯一写入口：更新内存状态前先写入 localStorage，日后可替换为 api.saveLineup。
  const persist = (next: Lineup) => {
    const saved = { ...next, updatedAt: new Date().toISOString() };
    lineupRepository.save(saved);
    setLineups(lineupRepository.list());
    setSelected(saved);
  };
  // 本地 MVP 的球员写入边界；接入后端时可在这里改为 api.createPlayer / api.updatePlayer。
  const persistPlayer = (player: Player) => {
    playerRepository.save(player);
    setPlayers(listPlayers());
  };
  // 新建空阵容后立刻进入编辑页，避免用户还要额外导航一次。
  const newLineup = () => {
    const now = new Date().toISOString();
    const next: Lineup = {
      id: crypto.randomUUID(),
      name: '未命名阵容',
      description: '',
      members: [],
      createdAt: now,
      updatedAt: now,
    };
    persist(next);
    setView('lineups');
  };
  // 模拟引擎是无 UI 依赖的纯逻辑；页面负责保存比赛记录并跳转到战报。
  const play = (home: Lineup, away: Lineup) => {
    const next = simulate(home, away, players);
    simulationRepository.save(next);
    setGame(next);
    setView('battle');
  };
  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('players')}>
          <span className="brand-mark">DC</span>
          <span>
            Dream Court<small>HISTORY LAB</small>
          </span>
        </button>
        <nav>
          {(
            [
              ['players', '球员库'],
              ['lineups', '我的阵容'],
              ['battle', '梦幻对战'],
            ] as [View, string][]
          ).map(([id, label]) => (
            <button className={view === id ? 'active' : ''} onClick={() => setView(id)} key={id}>
              {label}
            </button>
          ))}
        </nav>
        <button className="primary compact" onClick={newLineup}>
          + 新建阵容
        </button>
      </header>
      {view === 'players' && (
        <PlayerLibrary
          players={players}
          onAdd={(player) => {
            const member: LineupMember = {
              playerId: player.id,
              position: player.defaultPosition,
              starter: selected.members.length < 5,
              inactive: false,
            };
            if (
              selected.members.some((m) => m.playerId === player.id) ||
              selected.members.length >= 15
            )
              return;
            persist({ ...selected, members: [...selected.members, member] });
          }}
          onSavePlayer={persistPlayer}
          onOpenLineup={() => setView('lineups')}
        />
      )}
      {view === 'lineups' && (
        <LineupWorkbench
          players={players}
          lineups={lineups}
          selected={selected}
          onSelect={setSelected}
          onSave={persist}
          onNew={newLineup}
          onPlay={play}
        />
      )}
      {view === 'battle' && (
        <Battle players={players} lineups={lineups} game={game} onPlay={play} />
      )}
      <footer>
        独立爱好者原型 · 不隶属于任何联盟、球队或球员工会 ·
        使用原创示例数值，不含照片、标志或球衣设计
      </footer>
    </main>
  );
}

function PlayerLibrary({ players, onAdd, onSavePlayer, onOpenLineup }: PlayerLibraryProps) {
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<'ALL' | Position>('ALL');
  const [sort, setSort] = useState<'overall' | 'threePoint' | 'salaryUsd'>('overall');
  const [focus, setFocus] = useState<Player>(players[0]);
  const [editing, setEditing] = useState<Player | null>(null);
  // 过滤和排序是派生数据，不应再放进 state，避免搜索条件变化时出现两份数据不同步。
  const list = useMemo(
    () =>
      players
        .filter(
          (p) =>
            (!query || `${p.name} ${p.archetype}`.toLowerCase().includes(query.toLowerCase())) &&
            (pos === 'ALL' || p.defaultPosition === pos),
        )
        .sort((a, b) => (sort === 'overall' ? average(b) - average(a) : b[sort] - a[sort])),
    [players, query, pos, sort],
  );
  const createCustomPlayer = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: 'Custom Player',
      initials: 'CP',
      peakSeason: 'Custom',
      peakTeam: 'Free Agent',
      defaultPosition: 'PG',
      heightFeet: 6,
      heightInches: 6,
      weightLbs: 210,
      salaryUsd: 0,
      archetype: 'Custom player',
      bio: 'A player created for this roster.',
      accent: '#c3ec8b',
      isCustom: true,
      ...defaultRatings,
    });
  };
  const savePlayer = (player: Player) => {
    onSavePlayer(player);
    setFocus(player);
    setEditing(null);
  };
  return (
    <section className="page player-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE ARCHIVE</p>
          <h1>巅峰球员库</h1>
          <p>为每位球员保留一个巅峰赛季的原创能力档案。</p>
        </div>
        <div className="page-heading-actions">
          <button className="ghost" onClick={onOpenLineup}>
            查看当前阵容 →
          </button>
          <button className="primary compact" onClick={createCustomPlayer}>
            + 自定义球员
          </button>
        </div>
      </div>
      <div className="filters">
        <label className="search">
          ⌕{' '}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索球员或打法"
          />
        </label>
        <div className="pills">
          <button className={pos === 'ALL' ? 'selected' : ''} onClick={() => setPos('ALL')}>
            全部
          </button>
          {positions.map((x) => (
            <button className={pos === x ? 'selected' : ''} onClick={() => setPos(x)} key={x}>
              {x}
            </button>
          ))}
        </div>
        <label className="sort">
          排序{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="overall">综合能力</option>
            <option value="threePoint">三分能力</option>
            <option value="salaryUsd">巅峰薪资</option>
          </select>
        </label>
      </div>
      <div className="player-layout">
        <div className="player-grid">
          {list.map((p) => (
            <button
              className={'player-card ' + (focus.id === p.id ? 'focus' : '')}
              key={p.id}
              onClick={() => setFocus(p)}
            >
              <span className="portrait" style={{ background: p.accent }}>
                {p.initials}
              </span>
              <span className="player-info">
                <b>{p.name}</b>
                <small>
                  {p.peakSeason} · {p.peakTeam}
                </small>
                <em>{p.archetype}</em>
              </span>
              <strong>
                {average(p)}
                <small>OVR</small>
              </strong>
            </button>
          ))}
        </div>
        {editing ? (
          <PlayerEditor player={editing} onCancel={() => setEditing(null)} onSave={savePlayer} />
        ) : (
          <PlayerDetail
            player={focus}
            onAdd={() => onAdd(focus)}
            onEdit={() => setEditing(focus)}
          />
        )}
      </div>
    </section>
  );
}

function PlayerDetail({ player, onAdd, onEdit }: PlayerDetailProps) {
  return (
    <aside className="detail-panel">
      <div className="detail-top">
        <span className="portrait big" style={{ background: player.accent }}>
          {player.initials}
        </span>
        <div>
          <p className="eyebrow">
            {player.defaultPosition} · {player.peakSeason}
          </p>
          <h2>{player.name}</h2>
          <p>{player.archetype}</p>
        </div>
      </div>
      <p className="bio">{player.bio}</p>
      <div className="overall">
        <span>综合能力</span>
        <b>{average(player)}</b>
        <small>/ 99</small>
      </div>
      <div className="ratings">
        {ratingFields.map(({ key, label }) => (
          <div key={key}>
            <span>{label}</span>
            <i>
              <b style={{ width: `${player[key]}%` }} />
            </i>
            <strong>{player[key]}</strong>
          </div>
        ))}
      </div>
      <div className="detail-meta">
        <span>身高</span>
        <b>
          {player.heightFeet}' {player.heightInches}"
        </b>
        <span>体重</span>
        <b>{player.weightLbs} lb</b>
      </div>
      <div className="detail-meta">
        <span>巅峰赛季薪资</span>
        <b>{currency.format(player.salaryUsd)}</b>
      </div>
      <button className="primary wide" onClick={onAdd}>
        加入当前阵容
      </button>
      <button className="ghost wide player-edit-button" onClick={onEdit}>
        编辑球员属性
      </button>
    </aside>
  );
}

function PlayerEditor({ player, onCancel, onSave }: PlayerEditorProps) {
  // 编辑草稿与已保存数据分离，取消时不会污染当前球员档案或阵容中的能力值。
  const [draft, setDraft] = useState<Player>(player);
  const [error, setError] = useState<string | null>(null);
  const setText = (
    key: keyof Pick<
      Player,
      'name' | 'initials' | 'peakSeason' | 'peakTeam' | 'archetype' | 'bio' | 'accent'
    >,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const setNumber = (
    key: 'salaryUsd' | 'heightFeet' | 'heightInches' | 'weightLbs' | keyof Ratings,
    value: number,
  ) => {
    // 数字输入是逐字符组成的：例如 210 会依次经过 2、21、210，不能在中途强行改为 80。
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const submit = () => {
    if (!draft.name.trim()) {
      setError('请填写球员名称。');
      return;
    }
    if (!draft.initials.trim()) {
      setError('请填写球员缩写。');
      return;
    }
    const isIntegerWithin = (value: number, min: number, max: number) =>
      Number.isInteger(value) && value >= min && value <= max;
    if (!isIntegerWithin(draft.heightFeet, 4, 8)) {
      setError('身高英尺必须是 4–8 之间的整数。');
      return;
    }
    if (!isIntegerWithin(draft.heightInches, 0, 11)) {
      setError('身高英寸必须是 0–11 之间的整数。');
      return;
    }
    if (!isIntegerWithin(draft.weightLbs, 80, 500)) {
      setError('体重必须是 80–500 磅之间的整数。');
      return;
    }
    if (ratingFields.some(({ key }) => !isIntegerWithin(draft[key], 0, 99))) {
      setError('所有能力值必须是 0–99 之间的整数。');
      return;
    }
    onSave({ ...draft, name: draft.name.trim(), initials: draft.initials.trim().slice(0, 4) });
  };
  return (
    <aside className="detail-panel player-editor">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">PLAYER EDITOR</p>
          <h2>{player.isCustom ? '新建自定义球员' : '编辑球员属性'}</h2>
        </div>
        <button className="ghost" onClick={onCancel}>
          取消
        </button>
      </div>
      <div className="editor-grid">
        <label>
          名称
          <input value={draft.name} onChange={(event) => setText('name', event.target.value)} />
        </label>
        <label>
          缩写
          <input
            value={draft.initials}
            maxLength={4}
            onChange={(event) => setText('initials', event.target.value)}
          />
        </label>
        <label>
          默认位置
          <select
            value={draft.defaultPosition}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                defaultPosition: event.target.value as Position,
              }))
            }
          >
            {positions.map((position) => (
              <option key={position}>{position}</option>
            ))}
          </select>
        </label>
        <label>
          身高（英尺）
          <input
            type="number"
            min="4"
            max="8"
            value={draft.heightFeet}
            onChange={(event) => setNumber('heightFeet', Number(event.target.value))}
          />
        </label>
        <label>
          身高（英寸）
          <input
            type="number"
            min="0"
            max="11"
            value={draft.heightInches}
            onChange={(event) => setNumber('heightInches', Number(event.target.value))}
          />
        </label>
        <label>
          体重（磅）
          <input
            type="number"
            min="80"
            max="500"
            value={draft.weightLbs}
            onChange={(event) => setNumber('weightLbs', Number(event.target.value))}
          />
        </label>
        <label>
          巅峰赛季
          <input
            value={draft.peakSeason}
            onChange={(event) => setText('peakSeason', event.target.value)}
          />
        </label>
        <label>
          所属球队
          <input
            value={draft.peakTeam}
            onChange={(event) => setText('peakTeam', event.target.value)}
          />
        </label>
        <label>
          巅峰薪资（USD）
          <input
            type="number"
            min="0"
            value={draft.salaryUsd}
            onChange={(event) => setNumber('salaryUsd', Number(event.target.value))}
          />
        </label>
        <label>
          打法标签
          <input
            value={draft.archetype}
            onChange={(event) => setText('archetype', event.target.value)}
          />
        </label>
        <label>
          头像颜色
          <input value={draft.accent} onChange={(event) => setText('accent', event.target.value)} />
        </label>
      </div>
      <label className="editor-bio">
        简介
        <textarea value={draft.bio} onChange={(event) => setText('bio', event.target.value)} />
      </label>
      <div className="rating-editor">
        {ratingFields.map(({ key, label }) => (
          <label key={key}>
            <span>{label}</span>
            <input
              type="number"
              min="0"
              max="99"
              value={draft[key]}
              onChange={(event) => setNumber(key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
      {error && (
        <p className="editor-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary wide" onClick={submit}>
        保存球员
      </button>
    </aside>
  );
}

function LineupWorkbench({
  players,
  lineups,
  selected,
  onSelect,
  onSave,
  onNew,
  onPlay,
}: LineupWorkbenchProps) {
  const [opponentId, setOpponentId] = useState(lineups.find((l) => l.id !== selected.id)?.id ?? '');
  const [playerQuery, setPlayerQuery] = useState('');
  const [starterLimitMessage, setStarterLimitMessage] = useState<string | null>(null);
  const members = selected.members.map((m) => ({
    ...m,
    player: players.find((p) => p.id === m.playerId)!,
  }));
  // 仅改变编辑表格的显示顺序，不改写阵容成员的存储顺序，避免排序影响数据本身。
  const displayMembers = members
    .map((member, index) => ({ ...member, index }))
    .sort((left, right) => {
      const leftIsStarter = left.starter && !left.inactive;
      const rightIsStarter = right.starter && !right.inactive;

      if (leftIsStarter !== rightIsStarter) return leftIsStarter ? -1 : 1;
      if (leftIsStarter && rightIsStarter) {
        return (
          starterDisplayOrder.indexOf(left.position) - starterDisplayOrder.indexOf(right.position)
        );
      }

      return left.index - right.index;
    });
  const {
    activeCount,
    starterCount,
    missingStarterPositions,
    isStarterFormationValid,
    isEligibleForSimulation,
  } = validateLineup(selected);
  // 在当前编辑上下文内提供候选球员；已入选者不重复显示，避免用户添加后再手动处理重复项。
  const availablePlayers = players.filter(
    (player) =>
      !selected.members.some((member) => member.playerId === player.id) &&
      `${player.name} ${player.archetype}`.toLowerCase().includes(playerQuery.toLowerCase()),
  );
  const update = (partial: Partial<Lineup>) => onSave({ ...selected, ...partial });
  const changeMember = (idx: number, partial: Partial<LineupMember>) =>
    update({ members: selected.members.map((m, i) => (i === idx ? { ...m, ...partial } : m)) });
  // 这些规则同时控制“开始梦幻对战”按钮，后端接入时也应复用同样的校验。
  const valid = isEligibleForSimulation;
  const rosterIsFull = selected.members.length >= 15;

  const toggleStarter = (index: number) => {
    const member = selected.members[index];

    if (!member.starter && starterCount >= positions.length) {
      setStarterLimitMessage('首发最多只能有 5 人，请先将一名首发改为替补。');
      return;
    }

    setStarterLimitMessage(null);
    changeMember(index, { starter: !member.starter, inactive: false });
  };

  const starterStatus =
    starterLimitMessage ??
    (starterCount > positions.length
      ? `当前已有 ${starterCount} 名首发，首发只能有 5 名。`
      : starterCount < positions.length
        ? `当前首发 ${starterCount}/5 人，请设为 5 名首发并分配 1–5 号位。`
        : missingStarterPositions.length > 0
          ? '5 名首发的位置重复，请调整为 1–5 号位各一位。'
          : '首发位置已配齐：可以开始对战。');

  const addPlayer = (player: Player) => {
    if (rosterIsFull) return;

    update({
      members: [
        ...selected.members,
        {
          playerId: player.id,
          position: player.defaultPosition,
          starter: false,
          inactive: false,
        },
      ],
    });
    setPlayerQuery('');
  };
  return (
    <section className="page lineup-page">
      <div className="lineup-sidebar">
        <p className="eyebrow">SAVED ROSTERS</p>
        <div className="roster-list">
          {lineups.map((l) => (
            <button
              className={l.id === selected.id ? 'selected' : ''}
              key={l.id}
              onClick={() => onSelect(l)}
            >
              <b>{l.name}</b>
              <small>{l.members.length}/15 人</small>
            </button>
          ))}
        </div>
        <button className="ghost wide" onClick={onNew}>
          + 新建阵容
        </button>
      </div>
      <div className="workbench">
        <div className="lineup-heading">
          <div>
            <input
              value={selected.name}
              onChange={(e) => update({ name: e.target.value })}
              aria-label="阵容名称"
            />
            <input
              className="description"
              value={selected.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="为这支队伍写一句注释"
            />
          </div>
          <div className={'rule-state ' + (valid ? 'good' : '')}>
            <b>{valid ? '阵容合规' : '需要完善'}</b>
            <span>
              {selected.members.length}/15 · {activeCount}/13 激活
            </span>
          </div>
        </div>
        <div className="rule-note">
          <span>编制规则</span>
          <p>5–15 人 · 最多 13 人激活 · 首发必须各有一位 PG / SG / SF / PF / C · 可自由错位</p>
        </div>
        <div
          className={
            'starter-rule-alert ' +
            (isStarterFormationValid ? 'complete' : starterCount > positions.length ? 'error' : '')
          }
          role="status"
        >
          <strong>{starterStatus}</strong>
          {!isStarterFormationValid && missingStarterPositions.length > 0 && (
            <span>
              当前还缺：
              {missingStarterPositions.map((position) => (
                <b key={position}>{position}</b>
              ))}
            </span>
          )}
        </div>
        <section className="inline-player-picker" aria-label="添加球员">
          <div className="picker-heading">
            <div>
              <p className="eyebrow">ADD TO ROSTER</p>
              <h2>直接添加球员</h2>
            </div>
            <span>
              {rosterIsFull ? '阵容已满（15/15）' : `还可加入 ${15 - selected.members.length} 人`}
            </span>
          </div>
          <label className="search picker-search">
            ⌕{' '}
            <input
              value={playerQuery}
              onChange={(event) => setPlayerQuery(event.target.value)}
              placeholder="搜索未加入的球员或打法"
              aria-label="搜索未加入的球员"
            />
          </label>
          <div className="picker-results">
            {availablePlayers.map((player) => (
              <button
                className="picker-player"
                key={player.id}
                onClick={() => addPlayer(player)}
                disabled={rosterIsFull}
              >
                <i style={{ background: player.accent }}>{player.initials}</i>
                <span>
                  <b>{player.name}</b>
                  <small>
                    {player.defaultPosition} · {average(player)} OVR · {player.archetype}
                  </small>
                </span>
                <strong>+ 加入</strong>
              </button>
            ))}
            {!availablePlayers.length && (
              <p className="picker-empty">
                {rosterIsFull ? '阵容已满，请先移除一名球员。' : '没有匹配的未加入球员。'}
              </p>
            )}
          </div>
        </section>
        <div className="roster-table">
          <div className="roster-row header">
            <span>球员</span>
            <span>位置</span>
            <span>角色</span>
            <span>状态</span>
            <span />
          </div>
          {displayMembers.map(({ player, index, ...m }) => (
            <div className="roster-row" key={m.playerId}>
              <span className="name-cell">
                <i style={{ background: player.accent }}>{player.initials}</i>
                <b>
                  {player.name}
                  <small>
                    {average(player)} OVR · {player.archetype}
                  </small>
                </b>
              </span>
              <span>
                <select
                  value={m.position}
                  onChange={(e) => changeMember(index, { position: e.target.value as Position })}
                >
                  {positions.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </span>
              <span>
                <button
                  className={'tag ' + (m.starter ? 'on' : '')}
                  onClick={() => toggleStarter(index)}
                >
                  {m.starter ? '首发' : '替补'}
                </button>
              </span>
              <span>
                <button
                  className={'tag ' + (m.inactive ? 'off' : '')}
                  onClick={() =>
                    changeMember(index, {
                      inactive: !m.inactive,
                      starter: m.inactive ? m.starter : false,
                    })
                  }
                >
                  {m.inactive ? '非激活' : '激活'}
                </button>
              </span>
              <button
                className="remove"
                onClick={() => update({ members: selected.members.filter((_, i) => i !== index) })}
              >
                ×
              </button>
            </div>
          ))}
          {!members.length && <div className="empty">从球员库把球员加入这个阵容。</div>}
        </div>
        <div className="workbench-actions">
          <button className="ghost" onClick={() => onSave(selected)}>
            保存阵容
          </button>
          <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
            <option value="">选择对手阵容</option>
            {lineups
              .filter((l) => l.id !== selected.id)
              .map((l) => (
                <option value={l.id} key={l.id}>
                  {l.name}
                </option>
              ))}
          </select>
          <button
            className="primary"
            disabled={!valid || !opponentId}
            onClick={() => {
              const other = lineups.find((x) => x.id === opponentId);
              if (other) onPlay(selected, other);
            }}
          >
            开始梦幻对战 →
          </button>
        </div>
      </div>
    </section>
  );
}

function Battle({ players, lineups, game, onPlay }: BattleProps) {
  const [homeId, setHomeId] = useState(lineups[0]?.id || '');
  const [awayId, setAwayId] = useState(lineups[1]?.id || '');
  const home = lineups.find((x) => x.id === homeId);
  const away = lineups.find((x) => x.id === awayId);
  // 历史战报需按其保存的阵容 ID 展示，不能误用选择器当前选择的阵容。
  const matchup =
    game &&
    lineups.find((l) => l.id === game.homeLineupId) &&
    lineups.find((l) => l.id === game.awayLineupId);
  const showHome = matchup ? lineups.find((l) => l.id === game!.homeLineupId)! : home;
  const showAway = matchup ? lineups.find((l) => l.id === game!.awayLineupId)! : away;
  return (
    <section className="page battle-page">
      <div className="battle-hero">
        <p className="eyebrow">SIMULATION LAB</p>
        <h1>梦幻对战</h1>
        <p>统计模型会以能力、角色与随机种子计算一场可复现的比赛。</p>
        <div className="matchup-picker">
          <select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
            {lineups.map((l) => (
              <option value={l.id} key={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <span>VS</span>
          <select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
            {lineups.map((l) => (
              <option value={l.id} key={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            className="primary"
            disabled={!home || !away || homeId === awayId}
            onClick={() => home && away && onPlay(home, away)}
          >
            模拟比赛
          </button>
        </div>
      </div>
      {game && showHome && showAway ? (
        <GameResult game={game} home={showHome} away={showAway} players={players} />
      ) : (
        <div className="empty large">选择两套不同阵容，开始第一场梦幻对战。</div>
      )}
    </section>
  );
}

function GameResult({ game, home, away, players }: GameResultProps) {
  // 模拟层只返回统计值；展示层在这里把 playerId 关联回球员昵称和抽象头像颜色。
  const rows = (stats: Simulation['homeStats']) =>
    stats.map((s) => {
      const p = players.find((x) => x.id === s.playerId)!;
      return (
        <tr key={s.playerId}>
          <td>
            <i style={{ background: p.accent }}>{p.initials}</i>
            {p.name}
          </td>
          <td>{s.minutes}</td>
          <td>
            <b>{s.points}</b>
          </td>
          <td>{s.rebounds}</td>
          <td>{s.assists}</td>
          <td>{s.steals}</td>
          <td>{s.blocks}</td>
          <td>
            {s.fgMade}-{s.fgAttempted}
          </td>
        </tr>
      );
    });
  return (
    <div className="game-result">
      <div className="scoreboard">
        <div>
          <small>HOME</small>
          <b>{home.name}</b>
          <strong>{game.homeScore}</strong>
        </div>
        <span>
          FINAL<small>Seed · {game.seed}</small>
        </span>
        <div>
          <small>AWAY</small>
          <b>{away.name}</b>
          <strong>{game.awayScore}</strong>
        </div>
      </div>
      <div className="stat-columns">
        <StatTable name={home.name} rows={rows(game.homeStats)} />
        <StatTable name={away.name} rows={rows(game.awayStats)} />
      </div>
    </div>
  );
}
function StatTable({ name, rows }: StatTableProps) {
  return (
    <div className="stat-table">
      <h3>{name}</h3>
      <table>
        <thead>
          <tr>
            <th>球员</th>
            <th>MIN</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>STL</th>
            <th>BLK</th>
            <th>FG</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
