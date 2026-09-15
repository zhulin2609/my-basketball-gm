import { useMemo, useState, type ReactNode } from 'react';
import {
  players,
  bootstrapLineups,
  lineupRepository,
  simulationRepository,
} from '@/lib/repository';
import { STARTER_POSITIONS, validateLineup } from '@/lib/lineup-validation';
import { simulate } from '@/lib/simulator';
import type { Lineup, LineupMember, Player, Position, Simulation } from '@/types';

type View = 'players' | 'lineups' | 'battle';

// 位置是阵容条目的属性，而不是球员的固定属性：同一球员在不同阵容中可打不同位置。
const positions = STARTER_POSITIONS;
const starterDisplayOrder: Position[] = ['C', 'PF', 'SF', 'SG', 'PG'];

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
  onAdd: (player: Player) => void;
  onOpenLineup: () => void;
}

interface PlayerDetailProps {
  player: Player;
  onAdd: () => void;
}

interface LineupWorkbenchProps {
  lineups: Lineup[];
  selected: Lineup;
  onSelect: (lineup: Lineup) => void;
  onSave: (lineup: Lineup) => void;
  onNew: () => void;
  onPlay: (home: Lineup, away: Lineup) => void;
}

interface BattleProps {
  lineups: Lineup[];
  game: Simulation | null;
  onPlay: (home: Lineup, away: Lineup) => void;
}

interface GameResultProps {
  game: Simulation;
  home: Lineup;
  away: Lineup;
}

interface StatTableProps {
  name: string;
  rows: ReactNode;
}

export function App() {
  // App 只保存跨页面共享的状态；各页面组件只通过回调修改这些状态。
  const [view, setView] = useState<View>('players');
  const [lineups, setLineups] = useState<Lineup[]>(initialLineups);
  const [selected, setSelected] = useState<Lineup>(initialLineups[0]);
  const [game, setGame] = useState<Simulation | null>(simulationRepository.list()[0] ?? null);
  // 阵容的唯一写入口：更新内存状态前先写入 localStorage，日后可替换为 api.saveLineup。
  const persist = (next: Lineup) => {
    const saved = { ...next, updatedAt: new Date().toISOString() };
    lineupRepository.save(saved);
    setLineups(lineupRepository.list());
    setSelected(saved);
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
          onOpenLineup={() => setView('lineups')}
        />
      )}
      {view === 'lineups' && (
        <LineupWorkbench
          lineups={lineups}
          selected={selected}
          onSelect={setSelected}
          onSave={persist}
          onNew={newLineup}
          onPlay={play}
        />
      )}
      {view === 'battle' && <Battle lineups={lineups} game={game} onPlay={play} />}
      <footer>
        独立爱好者原型 · 不隶属于任何联盟、球队或球员工会 ·
        使用原创示例数值，不含照片、标志或球衣设计
      </footer>
    </main>
  );
}

function PlayerLibrary({ onAdd, onOpenLineup }: PlayerLibraryProps) {
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<'ALL' | Position>('ALL');
  const [sort, setSort] = useState<'overall' | 'threePoint' | 'salaryUsd'>('overall');
  const [focus, setFocus] = useState<Player>(players[0]);
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
    [query, pos, sort],
  );
  return (
    <section className="page player-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE ARCHIVE</p>
          <h1>巅峰球员库</h1>
          <p>为每位球员保留一个巅峰赛季的原创能力档案。</p>
        </div>
        <button className="ghost" onClick={onOpenLineup}>
          查看当前阵容 →
        </button>
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
        <PlayerDetail player={focus} onAdd={() => onAdd(focus)} />
      </div>
    </section>
  );
}

function PlayerDetail({ player, onAdd }: PlayerDetailProps) {
  const ratings = [
    ['三分', player.threePoint],
    ['上篮', player.layup],
    ['中投', player.midRange],
    ['内线进攻', player.insideScoring],
    ['扣篮', player.dunk],
    ['进攻篮板', player.offensiveRebound],
    ['防守篮板', player.defensiveRebound],
    ['运球', player.handling],
    ['传球', player.passing],
    ['防守意识', player.defensiveIQ],
    ['进攻意识', player.offensiveIQ],
    ['盖帽', player.block],
    ['抢断', player.steal],
    ['罚篮', player.freeThrow],
    ['速度', player.speed],
    ['敏捷', player.agility],
    ['力量', player.strength],
    ['弹跳', player.vertical],
    ['耐力', player.stamina],
  ];
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
        {ratings.map(([label, value]) => (
          <div key={label as string}>
            <span>{label}</span>
            <i>
              <b style={{ width: `${value}%` }} />
            </i>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="detail-meta">
        <span>巅峰赛季薪资</span>
        <b>{currency.format(player.salaryUsd)}</b>
      </div>
      <button className="primary wide" onClick={onAdd}>
        加入当前阵容
      </button>
    </aside>
  );
}

function LineupWorkbench({
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

function Battle({ lineups, game, onPlay }: BattleProps) {
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
        <GameResult game={game} home={showHome} away={showAway} />
      ) : (
        <div className="empty large">选择两套不同阵容，开始第一场梦幻对战。</div>
      )}
    </section>
  );
}

function GameResult({ game, home, away }: GameResultProps) {
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
