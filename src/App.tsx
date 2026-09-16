import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, isApiEnabled, type AuthSession, type LlmCredential } from '@/lib/api';
import {
  bootstrapLineups,
  classicLineup,
  lineupRepository,
  listPlayers,
  playerRepository,
  simulationRepository,
  starterLineup,
} from '@/lib/repository';
import { STARTER_POSITIONS, validateLineup } from '@/lib/lineup-validation';
import { simulate } from '@/lib/simulator';
import type {
  Lineup,
  LineupMember,
  Player,
  Position,
  Ratings,
  Simulation,
  SimulationMode,
} from '@/types';

type View = 'players' | 'lineups' | 'battle' | 'ai-settings';

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
// API 模式不能把浏览器存档迁移给另一个账号，因此只使用公共示例阵容作为首次模板。
const initialLineups = isApiEnabled ? [starterLineup(), classicLineup()] : bootstrapLineups();
const initialGames = isApiEnabled ? [] : simulationRepository.list();

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
const reportDateTime = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

interface PlayerLibraryProps {
  players: Player[];
  onAdd: (player: Player) => void;
  onSavePlayer: (player: Player) => Promise<Player>;
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
  onSave: (player: Player) => Promise<void>;
}

interface LineupWorkbenchProps {
  players: Player[];
  lineups: Lineup[];
  selected: Lineup;
  onSelect: (lineup: Lineup) => void;
  onSave: (lineup: Lineup) => void;
  onNew: () => void;
  onPlay: (home: Lineup, away: Lineup, mode?: SimulationMode) => Promise<void>;
  syncError: string | null;
}

interface BattleProps {
  players: Player[];
  lineups: Lineup[];
  games: Simulation[];
  game: Simulation | null;
  onSelectGame: (game: Simulation) => void;
  onPlay: (home: Lineup, away: Lineup, mode?: SimulationMode) => Promise<void>;
  onOpenAiSettings: () => void;
  isSimulating: boolean;
  simulationError: string | null;
}

interface GameResultProps {
  game: Simulation;
  players: Player[];
  isCloudReport: boolean;
}

interface StatTableProps {
  name: string;
  rows: ReactNode;
}

interface AuthScreenProps {
  onAuthenticated: (session: AuthSession) => void;
}

interface AiSettingsProps {
  onBack: () => void;
}

export function App() {
  // App 只保存跨页面共享的状态；各页面组件只通过回调修改这些状态。
  const [view, setView] = useState<View>('players');
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => api.readSession());
  const [lineups, setLineups] = useState<Lineup[]>(initialLineups);
  const [players, setPlayers] = useState<Player[]>(listPlayers);
  const [playerLoadError, setPlayerLoadError] = useState<string | null>(null);
  const [lineupSyncError, setLineupSyncError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selected, setSelected] = useState<Lineup>(initialLineups[0]);
  const [games, setGames] = useState<Simulation[]>(initialGames);
  const [game, setGame] = useState<Simulation | null>(initialGames[0] ?? null);
  // 同一阵容的请求串行化，防止用户连续输入名称时较早的网络请求覆盖较晚的修改。
  const lineupSaveQueues = useRef<Map<string, Promise<void>>>(new Map());
  const isAuthenticatedApi = isApiEnabled && authSession !== null;
  // 阵容的唯一写入口：离线模式写 localStorage；API 模式乐观更新并排队写入 PostgreSQL。
  const persist = (next: Lineup) => {
    const saved = { ...next, updatedAt: new Date().toISOString() };
    if (!isAuthenticatedApi) {
      lineupRepository.save(saved);
      setLineups(lineupRepository.list());
      setSelected(saved);
      return;
    }

    setLineups((current) => {
      const index = current.findIndex((lineup) => lineup.id === saved.id);
      return index < 0
        ? [saved, ...current]
        : current.map((lineup) => (lineup.id === saved.id ? saved : lineup));
    });
    setSelected((current) => (current.id === saved.id ? saved : current));

    const previous = lineupSaveQueues.current.get(saved.id) ?? Promise.resolve();
    const request = previous
      .catch(() => undefined)
      .then(() => api.saveLineup(saved))
      .then((remoteLineup) => {
        setLineups((current) =>
          current.map((lineup) => (lineup.id === remoteLineup.id ? remoteLineup : lineup)),
        );
        setSelected((current) => (current.id === remoteLineup.id ? remoteLineup : current));
        setLineupSyncError(null);
      });
    lineupSaveQueues.current.set(saved.id, request);
    void request.catch((error: unknown) => {
      setLineupSyncError(error instanceof Error ? error.message : '阵容保存失败。');
    });
  };
  // API 模式下，球员和阵容都从 PostgreSQL 读取；没有远端阵容时迁移本机示例阵容。
  useEffect(() => {
    if (!isAuthenticatedApi) return;
    void api
      .listPlayers()
      .then((remotePlayers) => {
        setPlayers(remotePlayers);
        setPlayerLoadError(null);
      })
      .catch((error: unknown) => {
        setPlayerLoadError(error instanceof Error ? error.message : '球员库加载失败。');
      });
  }, [isAuthenticatedApi]);
  useEffect(() => {
    if (!isAuthenticatedApi) return;
    void api
      .listSimulations()
      .then((remoteGames) => {
        setGames(remoteGames);
        setGame((current) => current ?? remoteGames[0] ?? null);
        setSimulationError(null);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : '未知错误';
        setSimulationError(`无法加载云端战报：${message}`);
      });
  }, [isAuthenticatedApi]);
  useEffect(() => {
    if (!isAuthenticatedApi) return;
    void api
      .listLineups()
      .then(async (remoteLineups) => {
        const savedLineups = remoteLineups.length
          ? remoteLineups
          : await Promise.all(initialLineups.map((lineup) => api.saveLineup(lineup)));
        setLineups(savedLineups);
        setSelected(
          (current) =>
            savedLineups.find((lineup) => lineup.id === current.id) ?? savedLineups[0] ?? current,
        );
        setLineupSyncError(null);
      })
      .catch((error: unknown) => {
        setLineupSyncError(error instanceof Error ? error.message : '阵容库加载失败。');
      });
  }, [isAuthenticatedApi]);
  const persistPlayer = async (player: Player): Promise<Player> => {
    if (isAuthenticatedApi) {
      const { id: _id, isCustom: _isCustom, ...payload } = player;
      const saved = player.isCustom
        ? await api.createPlayer(payload)
        : await api.updatePlayer(player.id, payload);
      setPlayers((current) => {
        const index = current.findIndex((item) => item.id === saved.id);
        return index < 0
          ? [saved, ...current]
          : current.map((item) => (item.id === saved.id ? saved : item));
      });
      return saved;
    }
    playerRepository.save(player);
    setPlayers(listPlayers());
    return player;
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
    // persist 在云端模式只更新已选中的阵容；新阵容需先切换焦点，才能避免仍停在旧阵容。
    setSelected(next);
    persist(next);
    setView('lineups');
  };
  // 云端模式先等待阵容同步，再由 Java 引擎计算并原子保存；离线演示继续使用纯 TS 引擎。
  const play = async (
    home: Lineup,
    away: Lineup,
    mode: SimulationMode = 'local',
  ): Promise<void> => {
    setView('battle');
    setIsSimulating(true);
    setSimulationError(null);

    try {
      let next: Simulation;
      if (isAuthenticatedApi) {
        const pendingSaves = [
          lineupSaveQueues.current.get(home.id),
          lineupSaveQueues.current.get(away.id),
        ].filter((request): request is Promise<void> => Boolean(request));
        await Promise.all(pendingSaves);
        next = await api.simulate(home.id, away.id, mode);
      } else {
        next = simulate(home, away, players);
        simulationRepository.save(next);
      }

      setGames((current) => [next, ...current.filter((report) => report.id !== next.id)]);
      setGame(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setSimulationError(`比赛未完成或战报未能保存：${message}`);
    } finally {
      setIsSimulating(false);
    }
  };
  useEffect(() => {
    if (!isAuthenticatedApi) return;
    void api
      .currentUser()
      .then((user) => {
        setAuthSession((current) => (current ? { ...current, user } : current));
      })
      .catch(() => {
        api.clearSession();
        setAuthSession(null);
      });
  }, [isAuthenticatedApi]);

  if (isApiEnabled && !authSession) {
    return <AuthScreen onAuthenticated={setAuthSession} />;
  }

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
        <div className="topbar-actions">
          {isApiEnabled && authSession && (
            <>
              <span className="account-name">{authSession.user.username}</span>
              <button className="secondary compact" onClick={() => setView('ai-settings')}>
                AI 设置
              </button>
              <button
                className="secondary compact"
                onClick={() => {
                  api.clearSession();
                  setAuthSession(null);
                }}
              >
                退出登录
              </button>
            </>
          )}
          <button className="primary compact" onClick={newLineup}>
            + 新建阵容
          </button>
        </div>
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
          loadError={playerLoadError}
          onRetry={() => {
            void api
              .listPlayers()
              .then(setPlayers)
              .then(() => setPlayerLoadError(null))
              .catch((error: unknown) =>
                setPlayerLoadError(error instanceof Error ? error.message : '球员库加载失败。'),
              );
          }}
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
          syncError={lineupSyncError}
        />
      )}
      {view === 'battle' && (
        <Battle
          players={players}
          lineups={lineups}
          games={games}
          game={game}
          onSelectGame={setGame}
          onPlay={play}
          onOpenAiSettings={() => setView('ai-settings')}
          isSimulating={isSimulating}
          simulationError={simulationError}
        />
      )}
      {view === 'ai-settings' && <AiSettings onBack={() => setView('battle')} />}
      <footer>
        独立爱好者原型 · 不隶属于任何联盟、球队或球员工会 ·
        使用原创示例数值，不含照片、标志或球衣设计
      </footer>
    </main>
  );
}

function AiSettings({ onBack }: AiSettingsProps) {
  const [credential, setCredential] = useState<LlmCredential | null>(null);
  const [isEditingCredential, setIsEditingCredential] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void api
      .getLlmCredential()
      .then((saved) => {
        setCredential(saved);
        setIsEditingCredential(false);
        setBaseUrl(saved.baseUrl ?? 'https://api.openai.com/v1');
        setModel(saved.model ?? '');
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : '无法读取 AI 设置。');
      });
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      const saved = await api.saveLlmCredential({ baseUrl, model, apiKey });
      setCredential(saved);
      setIsEditingCredential(false);
      setApiKey('');
      setNotice('已加密保存。你可在梦幻对战页主动选择 AI 模拟。');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async () => {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await api.deleteLlmCredential();
      setCredential({ configured: false, baseUrl: null, model: null, apiKeyHint: null });
      setIsEditingCredential(false);
      setApiKey('');
      setNotice('AI Key 已删除。本地模拟仍可正常使用。');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSavedCredential = credential?.configured === true;
  const showCredentialForm = !hasSavedCredential || isEditingCredential;

  return (
    <section className="page ai-settings" aria-labelledby="ai-settings-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPENAI-COMPATIBLE</p>
          <h1 id="ai-settings-title">AI 比赛模拟（可选）</h1>
        </div>
        <button className="ghost" onClick={onBack}>
          返回梦幻对战
        </button>
      </div>
      <div className="settings-card">
        <p>
          配置后，比赛比分和球员数据会由你选择的大模型生成。API Key
          仅在服务端加密保存，页面不会再次显示完整 Key。不配置也可以一直使用本地模拟。
        </p>
        {notice && <p className="settings-notice">{notice}</p>}
        {hasSavedCredential && !isEditingCredential && (
          <div className="credential-status">
            <p>当前已启用</p>
            <strong>{credential.model}</strong>
            <span>{credential.baseUrl}</span>
            <span>API Key：{credential.apiKeyHint}</span>
            <div className="credential-actions">
              <button className="primary" onClick={() => setIsEditingCredential(true)}>
                更新连接配置
              </button>
              <button
                className="secondary danger-button"
                disabled={isSubmitting}
                onClick={() => void remove()}
              >
                删除 API Key
              </button>
            </div>
          </div>
        )}
        {showCredentialForm && (
          <form className="auth-form" onSubmit={save}>
            <label>
              API Base URL
              <input
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.openai.com/v1"
                required
                type="url"
                value={baseUrl}
              />
            </label>
            <label>
              模型 ID（例如 gpt-4.1-mini；不要填写 GPT）
              <input
                onChange={(event) => setModel(event.target.value)}
                placeholder="例如 gpt-4.1-mini"
                required
                value={model}
              />
            </label>
            <label>
              API Key
              <input
                autoComplete="off"
                minLength={1}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={hasSavedCredential ? '输入新 Key 以替换现有配置' : '粘贴你的 API Key'}
                required
                type="password"
                value={apiKey}
              />
            </label>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? '保存中…'
                : hasSavedCredential
                  ? '保存新的连接配置'
                  : '加密保存并启用 AI 模拟'}
            </button>
            {hasSavedCredential && (
              <button
                className="ghost"
                disabled={isSubmitting}
                onClick={() => {
                  setApiKey('');
                  setError(null);
                  setIsEditingCredential(false);
                }}
                type="button"
              >
                取消
              </button>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const session =
        mode === 'login'
          ? await api.login({ username, password })
          : await api.register({ username, password });
      api.saveSession(session);
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登录失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark">DC</div>
        <p className="eyebrow">DREAM COURT · HISTORY LAB</p>
        <h1 id="auth-title">{mode === 'login' ? '登录你的篮球经理' : '创建篮球经理账号'}</h1>
        <p className="auth-copy">登录后，球员修改、阵容和云端战报将只归属于你的账号。</p>
        <form onSubmit={submit} className="auth-form">
          <label>
            用户名
            <input
              autoComplete="username"
              maxLength={32}
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              pattern="[A-Za-z0-9_-]{3,32}"
              required
              value={username}
            />
          </label>
          <label>
            密码
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? '还没有账号？' : '已经有账号？'}
          <button
            onClick={() => {
              setError(null);
              setMode((current) => (current === 'login' ? 'register' : 'login'));
            }}
            type="button"
          >
            {mode === 'login' ? '创建账号' : '去登录'}
          </button>
        </p>
        <p className="auth-hint">用户名可使用 3–32 位字母、数字、下划线或连字符；密码至少 8 位。</p>
      </section>
    </main>
  );
}

function PlayerLibrary({
  players,
  onAdd,
  onSavePlayer,
  onOpenLineup,
  loadError,
  onRetry,
}: PlayerLibraryProps & { loadError: string | null; onRetry: () => void }) {
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
  const savePlayer = async (player: Player) => {
    const saved = await onSavePlayer(player);
    setFocus(saved);
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
      {isApiEnabled && (
        <p className="api-status">球员、阵容和近 30 天战报均保存到本地 PostgreSQL。</p>
      )}
      {loadError && (
        <p className="editor-error" role="alert">
          无法加载服务端球员库：{loadError}{' '}
          <button className="ghost" onClick={onRetry}>
            重试
          </button>
        </p>
      )}
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
  const [saving, setSaving] = useState(false);
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
  const submit = async () => {
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
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...draft,
        name: draft.name.trim(),
        initials: draft.initials.trim().slice(0, 4),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存球员失败。');
    } finally {
      setSaving(false);
    }
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
      <button className="primary wide" onClick={() => void submit()} disabled={saving}>
        {saving ? '保存中…' : '保存球员'}
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
  syncError,
}: LineupWorkbenchProps) {
  const [opponentId, setOpponentId] = useState(lineups.find((l) => l.id !== selected.id)?.id ?? '');
  const [playerQuery, setPlayerQuery] = useState('');
  const [starterLimitMessage, setStarterLimitMessage] = useState<string | null>(null);
  // 旧的 localStorage 阵容可能引用已从远端目录移除的球员；过滤缺失项而非用非空断言让页面崩溃。
  const missingPlayerIds = selected.members
    .filter((member) => !players.some((player) => player.id === member.playerId))
    .map((member) => member.playerId);
  const members = selected.members.flatMap((member) => {
    const player = players.find((candidate) => candidate.id === member.playerId);

    return player ? [{ ...member, player }] : [];
  });
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
  const valid = isEligibleForSimulation && missingPlayerIds.length === 0;
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
        {syncError && (
          <p className="editor-error" role="alert">
            阵容尚未同步到服务器：{syncError}
          </p>
        )}
        {missingPlayerIds.length > 0 && (
          <div className="starter-rule-alert error" role="alert">
            <strong>这套旧阵容引用了当前球员库中不存在的球员，无法开始对战。</strong>
            <span>请移除或替换：{missingPlayerIds.join('、')}</span>
          </div>
        )}
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
              if (other) void onPlay(selected, other);
            }}
          >
            使用本地引擎对战 →
          </button>
        </div>
      </div>
    </section>
  );
}

function Battle({
  players,
  lineups,
  games,
  game,
  onSelectGame,
  onPlay,
  onOpenAiSettings,
  isSimulating,
  simulationError,
}: BattleProps) {
  const [homeId, setHomeId] = useState(lineups[0]?.id || '');
  const [awayId, setAwayId] = useState(lineups[1]?.id || '');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('local');
  const [credential, setCredential] = useState<LlmCredential | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const home = lineups.find((x) => x.id === homeId);
  const away = lineups.find((x) => x.id === awayId);
  const homeIsEligible = home ? validateLineup(home).isEligibleForSimulation : false;
  const awayIsEligible = away ? validateLineup(away).isEligibleForSimulation : false;
  const aiIsAvailable = isApiEnabled && credential?.configured === true;

  // 每次进入对战页都读取最新的脱敏配置，从 AI 设置返回后无需刷新页面。
  useEffect(() => {
    if (!isApiEnabled) return;
    void api
      .getLlmCredential()
      .then((saved) => {
        setCredential(saved);
        setCredentialError(null);
      })
      .catch((error: unknown) => {
        setCredentialError(error instanceof Error ? error.message : '无法读取 AI 设置。');
      });
  }, []);

  // 本地引擎是始终可用的安全默认值；Key 被删除后不保留无效的 AI 选中状态。
  useEffect(() => {
    if (credential && !credential.configured) setSimulationMode('local');
  }, [credential]);

  return (
    <section className="page battle-page">
      <div className="battle-hero">
        <p className="eyebrow">SIMULATION LAB</p>
        <h1>梦幻对战</h1>
        <p>你可使用稳定、免费的内置规则引擎，也可主动选择已配置的 AI 模型。</p>
        {isApiEnabled && (
          <p className="retention-summary">
            云端战报仅保留 30 天，过期后立即不可查看，并在每天凌晨 3:00 自动清理。
          </p>
        )}
        <div className="simulation-mode-section">
          <div className="simulation-mode-heading">
            <strong>选择模拟方式</strong>
            <span>默认使用本地模拟，不需要 API Key</span>
          </div>
          <div className="simulation-mode-options" role="radiogroup" aria-label="模拟方式">
            <button
              aria-checked={simulationMode === 'local'}
              className={'simulation-mode-card ' + (simulationMode === 'local' ? 'selected' : '')}
              onClick={() => setSimulationMode('local')}
              role="radio"
              type="button"
            >
              <span className="mode-card-title">
                <strong>本地模拟</strong>
                <i>推荐</i>
              </span>
              <span>内置规则引擎计算比分和球员数据，立即生成，不产生 API 费用。</span>
            </button>
            <button
              aria-checked={simulationMode === 'ai'}
              className={'simulation-mode-card ' + (simulationMode === 'ai' ? 'selected' : '')}
              disabled={!aiIsAvailable}
              onClick={() => setSimulationMode('ai')}
              role="radio"
              type="button"
            >
              <span className="mode-card-title">
                <strong>AI 模拟</strong>
                <i className="experimental">实验性</i>
              </span>
              <span>
                {aiIsAvailable
                  ? `使用 ${credential.model} 生成；可能耗时、产生费用，且受模型兼容性影响。`
                  : '需要先配置 API Key；未配置也不影响本地模拟。'}
              </span>
            </button>
          </div>
          {isApiEnabled && credential && !credential.configured && (
            <div className="ai-setup-prompt">
              <span>尚未配置 AI，你现在就可以使用本地模拟。</span>
              <button className="ghost" onClick={onOpenAiSettings} type="button">
                配置 AI（可选）
              </button>
            </div>
          )}
          {credentialError && (
            <p className="mode-status-error" role="status">
              AI 配置状态暂时无法读取，本地模拟仍可正常使用。
            </p>
          )}
        </div>
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
            disabled={
              !home ||
              !away ||
              homeId === awayId ||
              !homeIsEligible ||
              !awayIsEligible ||
              isSimulating
            }
            onClick={() => {
              if (home && away) void onPlay(home, away, simulationMode);
            }}
          >
            {isSimulating
              ? '模拟并保存中…'
              : simulationMode === 'ai'
                ? '使用 AI 模拟'
                : '使用本地引擎模拟'}
          </button>
        </div>
      </div>
      {simulationError && (
        <p className="editor-error battle-error" role="alert">
          {simulationError}
        </p>
      )}
      {games.length > 0 && (
        <section className="report-history" aria-label="近 30 天云端战报">
          <div className="report-history-heading">
            <div>
              <p className="eyebrow">REPORT HISTORY</p>
              <h2>近 30 天战报</h2>
            </div>
            <span>{games.length} 场</span>
          </div>
          <div className="report-history-list">
            {games.map((report) => (
              <button
                className={report.id === game?.id ? 'selected' : ''}
                key={report.id}
                onClick={() => onSelectGame(report)}
              >
                <span>
                  <b>{report.homeLineupName ?? '主队'}</b>
                  <strong>
                    {report.homeScore}–{report.awayScore}
                  </strong>
                  <b>{report.awayLineupName ?? '客队'}</b>
                </span>
                <small>
                  {reportDateTime.format(new Date(report.createdAt))} · 保存至{' '}
                  {reportDateTime.format(new Date(report.expiresAt))}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}
      {game ? (
        <GameResult game={game} players={players} isCloudReport={isApiEnabled} />
      ) : (
        <div className="empty large">选择两套不同阵容，开始第一场梦幻对战。</div>
      )}
    </section>
  );
}

function GameResult({ game, players, isCloudReport }: GameResultProps) {
  // 模拟层只返回统计值；展示层在这里把 playerId 关联回球员昵称和抽象头像颜色。
  const rows = (stats: Simulation['homeStats']) =>
    stats.map((s) => {
      // 优先展示战报快照；旧版离线记录没有快照时才回查当前球员库。
      const p = players.find((x) => x.id === s.playerId);
      return (
        <tr key={s.playerId}>
          <td>
            <i style={{ background: s.playerAccent ?? p?.accent ?? '#777' }}>
              {s.playerInitials ?? p?.initials ?? '?'}
            </i>
            {s.playerName ?? p?.name ?? `已移除球员 (${s.playerId})`}
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
  const expiresAt = new Date(game.expiresAt);
  const remainingDays = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  const expirationIsNear = remainingDays <= 3;
  const homeName = game.homeLineupName ?? '主队';
  const awayName = game.awayLineupName ?? '客队';
  const engineLabel = game.engineVersion?.startsWith('llm:')
    ? `AI 模拟 · ${game.engineVersion.slice(4)}`
    : '本地规则引擎';
  return (
    <div className="game-result">
      <div className={'report-retention ' + (expirationIsNear ? 'expires-soon' : '')}>
        <div>
          <strong>{isCloudReport ? '云端战报' : '本地战报'}最多保存 30 天</strong>
          <small className="report-engine">{engineLabel}</small>
        </div>
        <span>
          保存至 {reportDateTime.format(expiresAt)}
          {remainingDays > 0 ? `（剩余 ${remainingDays} 天）` : '（已到期）'}，过期后不可恢复。
        </span>
      </div>
      <div className="scoreboard">
        <div>
          <small>HOME</small>
          <b>{homeName}</b>
          <strong>{game.homeScore}</strong>
        </div>
        <span>
          FINAL<small>Seed · {game.seed}</small>
        </span>
        <div>
          <small>AWAY</small>
          <b>{awayName}</b>
          <strong>{game.awayScore}</strong>
        </div>
      </div>
      <div className="stat-columns">
        <StatTable name={homeName} rows={rows(game.homeStats)} />
        <StatTable name={awayName} rows={rows(game.awayStats)} />
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
