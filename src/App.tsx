import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLocale, supportedLocales, type AppLocale } from '@/i18n';
import { api, isApiEnabled, type AuthSession, type LlmCredential } from '@/lib/api';
import { createGuestImportRequest } from '@/lib/guest-import';
import { guestWorkspaceRepository } from '@/lib/guest-workspace';
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
import { selectPlayerOfTheGame } from '@/lib/player-of-the-game';
import { simulate } from '@/lib/simulator';
import { usePagination } from '@/lib/use-pagination';
import type {
  CommunityComment,
  CommunityPostDetail,
  CommunityPostSummary,
  Lineup,
  LineupMember,
  PagedResponse,
  Player,
  Position,
  Ratings,
  Simulation,
  SimulationMode,
} from '@/types';

type View = 'players' | 'lineups' | 'battle' | 'community' | 'ai-settings' | 'auth';

// 位置是阵容条目的属性，而不是球员的固定属性：同一球员在不同阵容中可打不同位置。
const positions = STARTER_POSITIONS;
const starterDisplayOrder: Position[] = ['C', 'PF', 'SF', 'SG', 'PG'];
const PLAYER_PAGE_SIZE = 12;
const PICKER_PAGE_SIZE = 9;
const COMMUNITY_PAGE_SIZE = 10;
const COMMENT_PAGE_SIZE = 20;

interface RatingField {
  key: keyof Ratings;
  label: string;
}

const ratingKeys: Array<keyof Ratings> = [
  'threePoint',
  'layup',
  'midRange',
  'insideScoring',
  'dunk',
  'offensiveRebound',
  'defensiveRebound',
  'handling',
  'passing',
  'defensiveIQ',
  'offensiveIQ',
  'block',
  'steal',
  'freeThrow',
  'speed',
  'agility',
  'strength',
  'vertical',
  'stamina',
  'shotTendency',
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
function formatCurrency(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatReportDate(value: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const activeLocale: AppLocale = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-CN';

  return (
    <div className="language-switch" aria-label={t('language.selector')} role="group">
      {supportedLocales.map((locale) => (
        <button
          aria-pressed={activeLocale === locale}
          key={locale}
          lang={locale}
          onClick={() => void changeLocale(locale)}
          type="button"
        >
          {locale === 'zh-CN' ? t('language.chinese') : t('language.english')}
        </button>
      ))}
    </div>
  );
}

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
  onSave: (lineup: Lineup) => Promise<void>;
  onNew: () => void;
  onPlay: (home: Lineup, away: Lineup, mode?: SimulationMode) => Promise<void>;
  canShare: boolean;
  onShare: (lineup: Lineup) => Promise<string>;
  onOpenSharedPost: (postId: string) => void;
  syncError: string | null;
}

interface CommunityHubProps {
  isAuthenticated: boolean;
  postId: string | null;
  onOpenPost: (postId: string) => void;
  onClosePost: () => void;
  onRequireAuth: () => void;
  onCopied: (lineup: Lineup) => void;
  onLineupsChanged: () => Promise<void>;
}

interface CommunityListViewProps {
  onOpen: (postId: string) => void;
}

interface CommunityPostViewProps {
  postId: string;
  isAuthenticated: boolean;
  onBack: () => void;
  onRequireAuth: () => void;
  onCopied: (lineup: Lineup) => void;
  onLineupsChanged: () => Promise<void>;
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
  isCloudMode: boolean;
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

interface PaginationBarProps {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}

function PaginationBar({ page, pageCount, total, onChange }: PaginationBarProps) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  return (
    <nav className="pagination" aria-label={t('pagination.label')}>
      <button
        className="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        {t('pagination.prev')}
      </button>
      <span>{t('pagination.status', { page, pages: pageCount, total })}</span>
      <button
        className="ghost"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        {t('pagination.next')}
      </button>
    </nav>
  );
}

interface AuthScreenProps {
  onAuthenticated: (session: AuthSession) => void;
  onCancel: () => void;
}

interface AiSettingsProps {
  onBack: () => void;
}

export function App() {
  // App 只保存跨页面共享的状态；各页面组件只通过回调修改这些状态。
  const { t } = useTranslation();
  const [view, setView] = useState<View>('players');
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => api.readSession());
  const [lineups, setLineups] = useState<Lineup[]>(() =>
    isApiEnabled && authSession ? [starterLineup(), classicLineup()] : bootstrapLineups(),
  );
  const [players, setPlayers] = useState<Player[]>(listPlayers);
  const [playerLoadError, setPlayerLoadError] = useState<string | null>(null);
  const [lineupSyncError, setLineupSyncError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selected, setSelected] = useState<Lineup>(() => lineups[0] ?? starterLineup());
  const [games, setGames] = useState<Simulation[]>(() =>
    isApiEnabled && authSession ? [] : simulationRepository.list(),
  );
  const [game, setGame] = useState<Simulation | null>(() => games[0] ?? null);
  const [communityPostId, setCommunityPostId] = useState<string | null>(null);
  // 同一阵容的请求串行化，防止用户连续输入名称时较早的网络请求覆盖较晚的修改。
  const lineupSaveQueues = useRef<Map<string, Promise<void>>>(new Map());
  const isAuthenticatedApi = isApiEnabled && authSession !== null;
  // 阵容的唯一写入口：离线模式写 localStorage；API 模式乐观更新并排队写入 PostgreSQL。
  // 返回的 Promise 在数据真正写入完成后才 resolve，供保存按钮展示反馈。
  const persist = (next: Lineup): Promise<void> => {
    const saved = { ...next, updatedAt: new Date().toISOString() };
    if (!isAuthenticatedApi) {
      lineupRepository.save(saved);
      setLineups(lineupRepository.list());
      setSelected(saved);
      return Promise.resolve();
    }

    setLineups((current) => {
      const index = current.findIndex((lineup) => lineup.id === saved.id);
      return index < 0
        ? [saved, ...current]
        : current.map((lineup) => (lineup.id === saved.id ? saved : lineup));
    });
    setSelected((current) => (current.id === saved.id ? saved : current));

    const previous = lineupSaveQueues.current.get(saved.id) ?? Promise.resolve();
    const request: Promise<void> = previous
      .catch(() => undefined)
      .then(() => api.saveLineup(saved))
      .then((remoteLineup) => {
        // 已有更新的保存请求在排队时跳过覆盖，避免较早的响应让本地状态回退。
        if (lineupSaveQueues.current.get(saved.id) !== request) return;
        setLineups((current) =>
          current.map((lineup) => (lineup.id === remoteLineup.id ? remoteLineup : lineup)),
        );
        setSelected((current) => (current.id === remoteLineup.id ? remoteLineup : current));
        setLineupSyncError(null);
      });
    lineupSaveQueues.current.set(saved.id, request);
    void request.catch((error: unknown) => {
      setLineupSyncError(error instanceof Error ? error.message : t('errors.lineupSave'));
    });
    return request;
  };
  // 已认证后，球员和阵容都从 PostgreSQL 读取；没有远端阵容时创建账号自带示例阵容。
  useEffect(() => {
    if (!isAuthenticatedApi) return;
    void api
      .listPlayers()
      .then((remotePlayers) => {
        setPlayers(remotePlayers);
        setPlayerLoadError(null);
      })
      .catch((error: unknown) => {
        setPlayerLoadError(error instanceof Error ? error.message : t('errors.playerLoad'));
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
        const message = error instanceof Error ? error.message : t('errors.unknown');
        setSimulationError(t('errors.simulation', { message }));
      });
  }, [isAuthenticatedApi]);
  useEffect(() => {
    if (!isAuthenticatedApi) return;
    void api
      .listLineups()
      .then(async (remoteLineups) => {
        const savedLineups = remoteLineups.length
          ? remoteLineups
          : await Promise.all(
              [starterLineup(), classicLineup()].map((lineup) => api.saveLineup(lineup)),
            );
        setLineups(savedLineups);
        setSelected(
          (current) =>
            savedLineups.find((lineup) => lineup.id === current.id) ?? savedLineups[0] ?? current,
        );
        setLineupSyncError(null);
      })
      .catch((error: unknown) => {
        setLineupSyncError(error instanceof Error ? error.message : t('errors.lineupSave'));
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
      name: t('lineup.newLineup').replace('+ ', ''),
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
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setSimulationError(t('errors.simulation', { message }));
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
  // 公开、撤回、复制都会改变阵容的 sharedPostId 或阵容列表本身，统一从服务端重新拉取。
  const refreshLineups = async () => {
    if (!isAuthenticatedApi) return;
    try {
      const remoteLineups = await api.listLineups();
      setLineups(remoteLineups);
      setSelected((current) => remoteLineups.find((lineup) => lineup.id === current.id) ?? current);
    } catch (error: unknown) {
      setLineupSyncError(error instanceof Error ? error.message : t('errors.lineupSave'));
    }
  };
  const shareLineupToCommunity = async (lineup: Lineup): Promise<string> => {
    const post = await api.shareLineup(lineup.id);
    await refreshLineups();
    return post.id;
  };
  const openSharedPost = (postId: string) => {
    setCommunityPostId(postId);
    setView('community');
  };
  // 复制成功后新阵容直接进入阵容列表并设为当前编辑对象。
  const communityCopied = (lineup: Lineup) => {
    setLineups((current) => [lineup, ...current]);
    setSelected(lineup);
    setView('lineups');
  };

  if (view === 'auth') {
    return (
      <AuthScreen
        onAuthenticated={(session) => {
          setAuthSession(session);
          setView('players');
        }}
        onCancel={() => setView('players')}
      />
    );
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
              ['players', t('nav.players')],
              ['lineups', t('nav.lineups')],
              ['battle', t('nav.battle')],
              // 社区数据完全来自服务端，离线演示模式没有可访问的社区后端。
              ...(isApiEnabled ? [['community', t('nav.community')] as [View, string]] : []),
            ] as [View, string][]
          ).map(([id, label]) => (
            <button className={view === id ? 'active' : ''} onClick={() => setView(id)} key={id}>
              {label}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <LanguageSwitch />
          {isApiEnabled && !authSession && (
            <>
              <span className="guest-label">{t('guest.status')}</span>
              <button
                className="secondary compact guest-auth-button"
                onClick={() => setView('auth')}
              >
                {t('guest.login')}
              </button>
            </>
          )}
          {isApiEnabled && authSession && (
            <>
              <span className="account-name">{authSession.user.username}</span>
              <button className="secondary compact" onClick={() => setView('ai-settings')}>
                {t('nav.aiSettings')}
              </button>
              <button
                className="secondary compact"
                onClick={() => {
                  api.clearSession();
                  setAuthSession(null);
                  const guestLineups = bootstrapLineups();
                  const guestGames = simulationRepository.list();
                  setPlayers(listPlayers());
                  setLineups(guestLineups);
                  setSelected(guestLineups[0]);
                  setGames(guestGames);
                  setGame(guestGames[0] ?? null);
                  setView('players');
                }}
              >
                {t('nav.logout')}
              </button>
            </>
          )}
          <button className="primary compact" onClick={newLineup}>
            {t('nav.newLineup')}
          </button>
        </div>
      </header>
      {!authSession && (
        <aside className="guest-notice" role="status">
          <strong>{t('guest.noticeTitle')}</strong>
          <span>{t('guest.noticeBody')}</span>
          {guestWorkspaceRepository.load().hasUserProgress && (
            <button onClick={() => setView('auth')} type="button">
              {t('guest.saveProgress')}
            </button>
          )}
        </aside>
      )}
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
                setPlayerLoadError(error instanceof Error ? error.message : t('errors.playerLoad')),
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
          canShare={isAuthenticatedApi}
          onShare={shareLineupToCommunity}
          onOpenSharedPost={openSharedPost}
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
          isCloudMode={isAuthenticatedApi}
        />
      )}
      {view === 'community' && isApiEnabled && (
        <CommunityHub
          isAuthenticated={isAuthenticatedApi}
          postId={communityPostId}
          onOpenPost={setCommunityPostId}
          onClosePost={() => setCommunityPostId(null)}
          onRequireAuth={() => setView('auth')}
          onCopied={communityCopied}
          onLineupsChanged={refreshLineups}
        />
      )}
      {view === 'ai-settings' && isAuthenticatedApi && (
        <AiSettings onBack={() => setView('battle')} />
      )}
      <footer>{t('footer')}</footer>
    </main>
  );
}

function AiSettings({ onBack }: AiSettingsProps) {
  const { t } = useTranslation();
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
        setError(requestError instanceof Error ? requestError.message : t('ai.readFailed'));
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
      setNotice(t('ai.saved'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('ai.saveFailed'));
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
      setNotice(t('ai.deleted'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('ai.deleteFailed'));
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
          <h1 id="ai-settings-title">{t('ai.title')}</h1>
        </div>
        <button className="ghost" onClick={onBack}>
          {t('ai.back')}
        </button>
      </div>
      <div className="settings-card">
        <p>{t('ai.intro')}</p>
        {notice && <p className="settings-notice">{notice}</p>}
        {hasSavedCredential && !isEditingCredential && (
          <div className="credential-status">
            <p>{t('ai.enabled')}</p>
            <strong>{credential.model}</strong>
            <span>{credential.baseUrl}</span>
            <span>
              {t('ai.key')}
              {credential.apiKeyHint}
            </span>
            <div className="credential-actions">
              <button className="primary" onClick={() => setIsEditingCredential(true)}>
                {t('ai.update')}
              </button>
              <button
                className="secondary danger-button"
                disabled={isSubmitting}
                onClick={() => void remove()}
              >
                {t('ai.delete')}
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
              {t('ai.model')}
              <input
                onChange={(event) => setModel(event.target.value)}
                placeholder={t('ai.modelPlaceholder')}
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
                placeholder={hasSavedCredential ? t('ai.replaceKey') : t('ai.pasteKey')}
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
                ? t('common.saving')
                : hasSavedCredential
                  ? t('ai.saveNew')
                  : t('ai.saveAndEnable')}
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
                {t('common.cancel')}
              </button>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

function AuthScreen({ onAuthenticated, onCancel }: AuthScreenProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);

  const importGuestWorkspace = async (session: AuthSession): Promise<void> => {
    const workspace = guestWorkspaceRepository.load();
    if (!workspace.hasUserProgress) {
      onAuthenticated(session);
      return;
    }

    const request = createGuestImportRequest(workspace, listPlayers());
    await api.importGuestWorkspace(request);
    guestWorkspaceRepository.clear();
    onAuthenticated(session);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    let authenticatedSession: AuthSession | null = null;
    try {
      const session =
        mode === 'login'
          ? await api.login({ username, password })
          : await api.register({ username, password });
      authenticatedSession = session;
      api.saveSession(session);
      if (mode === 'login' && guestWorkspaceRepository.load().hasUserProgress) {
        setPendingSession(session);
        return;
      }
      await importGuestWorkspace(session);
    } catch (requestError) {
      if (authenticatedSession) setPendingSession(authenticatedSession);
      setError(requestError instanceof Error ? requestError.message : t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeGuestImport = async () => {
    if (!pendingSession) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await importGuestWorkspace(pendingSession);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('guest.importFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingSession) {
    const summary = guestWorkspaceRepository.summary();
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="guest-import-title">
          <LanguageSwitch />
          <button
            className="auth-cancel"
            onClick={() => {
              api.clearSession();
              onCancel();
            }}
            type="button"
          >
            {t('guest.continue')}
          </button>
          <div className="brand-mark">DC</div>
          <p className="eyebrow">GUEST WORKSPACE</p>
          <h1 id="guest-import-title">{t('guest.importTitle')}</h1>
          <p className="auth-copy">{t('guest.importBody')}</p>
          <p className="guest-import-summary">
            {t('guest.importSummary', {
              players: summary.playerCount,
              lineups: summary.lineupCount,
              simulations: summary.simulationCount,
            })}
          </p>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <div className="guest-import-actions">
            <button
              className="primary auth-submit"
              disabled={isSubmitting}
              onClick={() => void completeGuestImport()}
              type="button"
            >
              {isSubmitting ? t('common.processing') : t('guest.importNow')}
            </button>
            <button
              className="secondary"
              disabled={isSubmitting}
              onClick={() => onAuthenticated(pendingSession)}
              type="button"
            >
              {t('guest.skipImport')}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <LanguageSwitch />
        <button className="auth-cancel" onClick={onCancel} type="button">
          {t('guest.continue')}
        </button>
        <div className="brand-mark">DC</div>
        <p className="eyebrow">DREAM COURT · HISTORY LAB</p>
        <h1 id="auth-title">{mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}</h1>
        <p className="auth-copy">{t('auth.copy')}</p>
        <form onSubmit={submit} className="auth-form">
          <label>
            {t('auth.username')}
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
            {t('auth.password')}
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
            {isSubmitting
              ? t('common.processing')
              : mode === 'login'
                ? t('auth.login')
                : t('auth.register')}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
          <button
            onClick={() => {
              setError(null);
              setMode((current) => (current === 'login' ? 'register' : 'login'));
            }}
            type="button"
          >
            {mode === 'login' ? t('auth.createAccount') : t('auth.goLogin')}
          </button>
        </p>
        <p className="auth-hint">{t('auth.hint')}</p>
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
  const { t } = useTranslation();
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
  const pagination = usePagination(list, PLAYER_PAGE_SIZE, `${query}|${pos}|${sort}`);
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
          <h1>{t('players.title')}</h1>
          <p>{t('players.subtitle')}</p>
        </div>
        <div className="page-heading-actions">
          <button className="ghost" onClick={onOpenLineup}>
            {t('players.openLineup')}
          </button>
          <button className="primary compact" onClick={createCustomPlayer}>
            {t('players.custom')}
          </button>
        </div>
      </div>
      <div className="filters">
        <label className="search">
          ⌕{' '}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('players.search')}
          />
        </label>
        <div className="pills">
          <button className={pos === 'ALL' ? 'selected' : ''} onClick={() => setPos('ALL')}>
            {t('players.all')}
          </button>
          {positions.map((x) => (
            <button className={pos === x ? 'selected' : ''} onClick={() => setPos(x)} key={x}>
              {x}
            </button>
          ))}
        </div>
        <label className="sort">
          {t('players.sort')}{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="overall">{t('players.overall')}</option>
            <option value="threePoint">{t('players.threePoint')}</option>
            <option value="salaryUsd">{t('players.salary')}</option>
          </select>
        </label>
      </div>
      {loadError && (
        <p className="editor-error" role="alert">
          {t('players.loadFailed', { message: loadError })}{' '}
          <button className="ghost" onClick={onRetry}>
            {t('common.retry')}
          </button>
        </p>
      )}
      <div className="player-layout">
        <div className="player-list">
          <div className="player-grid">
            {pagination.pageItems.map((p) => (
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
          <PaginationBar
            onChange={pagination.setPage}
            page={pagination.page}
            pageCount={pagination.pageCount}
            total={list.length}
          />
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
  const { i18n, t } = useTranslation();
  const locale: AppLocale = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-CN';
  const ratingFields: RatingField[] = ratingKeys.map((key) => ({
    key,
    label: t(`ratings.${key}`),
  }));
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
        <span>{t('players.overall')}</span>
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
        <span>{t('players.height')}</span>
        <b>
          {player.heightFeet}' {player.heightInches}"
        </b>
        <span>{t('players.weight')}</span>
        <b>{player.weightLbs} lb</b>
      </div>
      <div className="detail-meta">
        <span>{t('players.peakSalary')}</span>
        <b>{player.salaryUsd > 0 ? formatCurrency(player.salaryUsd, locale) : '—'}</b>
      </div>
      <button className="primary wide" onClick={onAdd}>
        {t('players.add')}
      </button>
      <button className="ghost wide player-edit-button" onClick={onEdit}>
        {t('players.edit')}
      </button>
    </aside>
  );
}

function PlayerEditor({ player, onCancel, onSave }: PlayerEditorProps) {
  const { t } = useTranslation();
  const ratingFields: RatingField[] = ratingKeys.map((key) => ({
    key,
    label: t(`ratings.${key}`),
  }));
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
      setError(t('editor.nameRequired'));
      return;
    }
    if (!draft.initials.trim()) {
      setError(t('editor.initialsRequired'));
      return;
    }
    const isIntegerWithin = (value: number, min: number, max: number) =>
      Number.isInteger(value) && value >= min && value <= max;
    if (!isIntegerWithin(draft.heightFeet, 4, 8)) {
      setError(t('editor.feetInvalid'));
      return;
    }
    if (!isIntegerWithin(draft.heightInches, 0, 11)) {
      setError(t('editor.inchesInvalid'));
      return;
    }
    if (!isIntegerWithin(draft.weightLbs, 80, 500)) {
      setError(t('editor.weightInvalid'));
      return;
    }
    if (ratingKeys.some((key) => !isIntegerWithin(draft[key], 0, 99))) {
      setError(t('editor.ratingsInvalid'));
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
      setError(saveError instanceof Error ? saveError.message : t('editor.saveFailed'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <aside className="detail-panel player-editor">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">PLAYER EDITOR</p>
          <h2>{player.isCustom ? t('editor.newPlayer') : t('editor.title')}</h2>
        </div>
        <button className="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
      <div className="editor-grid">
        <label>
          {t('editor.name')}
          <input value={draft.name} onChange={(event) => setText('name', event.target.value)} />
        </label>
        <label>
          {t('editor.initials')}
          <input
            value={draft.initials}
            maxLength={4}
            onChange={(event) => setText('initials', event.target.value)}
          />
        </label>
        <label>
          {t('editor.defaultPosition')}
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
          {t('editor.heightFeet')}
          <input
            type="number"
            min="4"
            max="8"
            value={draft.heightFeet}
            onChange={(event) => setNumber('heightFeet', Number(event.target.value))}
          />
        </label>
        <label>
          {t('editor.heightInches')}
          <input
            type="number"
            min="0"
            max="11"
            value={draft.heightInches}
            onChange={(event) => setNumber('heightInches', Number(event.target.value))}
          />
        </label>
        <label>
          {t('editor.weight')}
          <input
            type="number"
            min="80"
            max="500"
            value={draft.weightLbs}
            onChange={(event) => setNumber('weightLbs', Number(event.target.value))}
          />
        </label>
        <label>
          {t('editor.peakSeason')}
          <input
            value={draft.peakSeason}
            onChange={(event) => setText('peakSeason', event.target.value)}
          />
        </label>
        <label>
          {t('editor.team')}
          <input
            value={draft.peakTeam}
            onChange={(event) => setText('peakTeam', event.target.value)}
          />
        </label>
        <label>
          {t('editor.salary')}
          <input
            type="number"
            min="0"
            value={draft.salaryUsd}
            onChange={(event) => setNumber('salaryUsd', Number(event.target.value))}
          />
        </label>
        <label>
          {t('editor.archetype')}
          <input
            value={draft.archetype}
            onChange={(event) => setText('archetype', event.target.value)}
          />
        </label>
        <label>
          {t('editor.color')}
          <input value={draft.accent} onChange={(event) => setText('accent', event.target.value)} />
        </label>
      </div>
      <label className="editor-bio">
        {t('editor.bio')}
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
        {saving ? t('common.saving') : t('editor.savePlayer')}
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
  canShare,
  onShare,
  onOpenSharedPost,
  syncError,
}: LineupWorkbenchProps) {
  const { t } = useTranslation();
  const [opponentId, setOpponentId] = useState(lineups.find((l) => l.id !== selected.id)?.id ?? '');
  const [playerQuery, setPlayerQuery] = useState('');
  const [starterLimitMessage, setStarterLimitMessage] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveResetTimer = useRef<number | null>(null);
  // 名称与注释使用本地草稿：拼音输入法组合期间只更新草稿，组合结束才写入阵容状态。
  // 组合中的每次按键若直接触发保存，较早的响应会在用户尚未选字时覆盖输入框内容。
  const [nameDraft, setNameDraft] = useState(selected.name);
  const [descriptionDraft, setDescriptionDraft] = useState(selected.description);
  const editingLineupId = useRef(selected.id);
  const composingInput = useRef(false);
  if (editingLineupId.current !== selected.id) {
    editingLineupId.current = selected.id;
    setNameDraft(selected.name);
    setDescriptionDraft(selected.description);
  }
  const changeName = (value: string) => {
    setNameDraft(value);
    if (!composingInput.current) update({ name: value });
  };
  const changeDescription = (value: string) => {
    setDescriptionDraft(value);
    if (!composingInput.current) update({ description: value });
  };
  useEffect(
    () => () => {
      if (saveResetTimer.current !== null) window.clearTimeout(saveResetTimer.current);
    },
    [],
  );
  const saveNow = async () => {
    if (saveState === 'saving') return;
    if (saveResetTimer.current !== null) window.clearTimeout(saveResetTimer.current);
    setSaveState('saving');
    try {
      await onSave(selected);
      setSaveState('saved');
      saveResetTimer.current = window.setTimeout(() => setSaveState('idle'), 1600);
    } catch {
      // 保存失败的原因已经通过 syncError 区域展示，这里只恢复按钮状态。
      setSaveState('idle');
    }
  };
  const sharedPostId = selected.sharedPostId ?? null;
  const shareBlockedPlayers = selected.shareBlockedPlayers ?? [];
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
  const pagination = usePagination(availablePlayers, PICKER_PAGE_SIZE, playerQuery);
  const update = (partial: Partial<Lineup>) => onSave({ ...selected, ...partial });
  const changeMember = (idx: number, partial: Partial<LineupMember>) =>
    update({ members: selected.members.map((m, i) => (i === idx ? { ...m, ...partial } : m)) });
  // 这些规则同时控制“开始梦幻对战”按钮，后端接入时也应复用同样的校验。
  const valid = isEligibleForSimulation && missingPlayerIds.length === 0;
  const rosterIsFull = selected.members.length >= 15;

  const toggleStarter = (index: number) => {
    const member = selected.members[index];

    if (!member.starter && starterCount >= positions.length) {
      setStarterLimitMessage(t('lineup.starterLimit'));
      return;
    }

    setStarterLimitMessage(null);
    changeMember(index, { starter: !member.starter, inactive: false });
  };

  const starterStatus =
    starterLimitMessage ??
    (starterCount > positions.length
      ? t('lineup.tooManyStarters', { count: starterCount })
      : starterCount < positions.length
        ? t('lineup.tooFewStarters', { count: starterCount })
        : missingStarterPositions.length > 0
          ? t('lineup.duplicateStarters')
          : t('lineup.startersReady'));

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
  const shareLineup = async () => {
    setShareError(null);
    setIsSharing(true);
    try {
      const postId = await onShare(selected);
      onOpenSharedPost(postId);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setShareError(t('community.shareFailed', { message }));
    } finally {
      setIsSharing(false);
    }
  };
  return (
    <section className="page lineup-page">
      <div className="lineup-sidebar">
        <p className="eyebrow">{t('lineup.savedRosters')}</p>
        <div className="roster-list">
          {lineups.map((l) => (
            <button
              className={l.id === selected.id ? 'selected' : ''}
              key={l.id}
              onClick={() => onSelect(l)}
            >
              <b>{l.name}</b>
              <small>{t('lineup.count', { count: l.members.length })}</small>
            </button>
          ))}
        </div>
        <button className="ghost wide" onClick={onNew}>
          {t('lineup.newLineup')}
        </button>
      </div>
      <div className="workbench">
        <div className="lineup-heading">
          <div>
            <input
              value={nameDraft}
              onChange={(e) => changeName(e.target.value)}
              onCompositionStart={() => {
                composingInput.current = true;
              }}
              onCompositionEnd={(e) => {
                composingInput.current = false;
                changeName(e.currentTarget.value);
              }}
              aria-label={t('lineup.name')}
            />
            <input
              className="description"
              value={descriptionDraft}
              onChange={(e) => changeDescription(e.target.value)}
              onCompositionStart={() => {
                composingInput.current = true;
              }}
              onCompositionEnd={(e) => {
                composingInput.current = false;
                changeDescription(e.currentTarget.value);
              }}
              placeholder={t('lineup.descriptionPlaceholder')}
            />
          </div>
          <div className={'rule-state ' + (valid ? 'good' : '')}>
            <b>{valid ? t('lineup.valid') : t('lineup.incomplete')}</b>
            <span>
              {t('lineup.activeCount', { members: selected.members.length, active: activeCount })}
            </span>
          </div>
        </div>
        <div className="rule-note">
          <span>{t('lineup.rules')}</span>
          <p>{t('lineup.rulesText')}</p>
        </div>
        {syncError && (
          <p className="editor-error" role="alert">
            {t('lineup.syncFailed', { message: syncError })}
          </p>
        )}
        {missingPlayerIds.length > 0 && (
          <div className="starter-rule-alert error" role="alert">
            <strong>{t('lineup.missingPlayers')}</strong>
            <span>{t('lineup.replacePlayers', { players: missingPlayerIds.join('、') })}</span>
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
              {t('lineup.missingPositions')}
              {missingStarterPositions.map((position) => (
                <b key={position}>{position}</b>
              ))}
            </span>
          )}
        </div>
        <section className="inline-player-picker" aria-label={t('lineup.addPlayer')}>
          <div className="picker-heading">
            <div>
              <p className="eyebrow">ADD TO ROSTER</p>
              <h2>{t('lineup.addPlayer')}</h2>
            </div>
            <span>
              {rosterIsFull
                ? t('lineup.rosterFull')
                : t('lineup.remainingSlots', { count: 15 - selected.members.length })}
            </span>
          </div>
          <label className="search picker-search">
            ⌕{' '}
            <input
              value={playerQuery}
              onChange={(event) => setPlayerQuery(event.target.value)}
              placeholder={t('lineup.searchAvailable')}
              aria-label={t('lineup.searchAvailable')}
            />
          </label>
          <div className="picker-results">
            {pagination.pageItems.map((player) => (
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
                <strong>{t('lineup.add')}</strong>
              </button>
            ))}
            {!availablePlayers.length && (
              <p className="picker-empty">
                {rosterIsFull ? t('lineup.fullRemoveFirst') : t('lineup.noMatches')}
              </p>
            )}
          </div>
          <PaginationBar
            onChange={pagination.setPage}
            page={pagination.page}
            pageCount={pagination.pageCount}
            total={availablePlayers.length}
          />
        </section>
        <div className="roster-table">
          <div className="roster-row header">
            <span>{t('common.player')}</span>
            <span>{t('common.position')}</span>
            <span>{t('common.role')}</span>
            <span>{t('common.status')}</span>
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
                  {m.starter ? t('common.starter') : t('common.bench')}
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
                  {m.inactive ? t('common.inactive') : t('common.active')}
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
          {!members.length && <div className="empty">{t('lineup.empty')}</div>}
        </div>
        <div className="workbench-actions">
          <button
            className={'ghost' + (saveState === 'saved' ? ' saved' : '')}
            disabled={saveState === 'saving'}
            onClick={() => void saveNow()}
          >
            {saveState === 'saving'
              ? t('common.saving')
              : saveState === 'saved'
                ? t('common.saved')
                : t('common.save')}
          </button>
          <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
            <option value="">{t('lineup.chooseOpponent')}</option>
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
            {t('lineup.localPlay')}
          </button>
        </div>
        {canShare && (
          <section aria-label={t('community.share')} className="share-panel">
            <div>
              <p className="eyebrow">Community</p>
              <strong>{sharedPostId ? t('community.reshare') : t('community.share')}</strong>
              {shareBlockedPlayers.length > 0 && (
                <p className="share-blocked">
                  {t('community.shareBlocked', { players: shareBlockedPlayers.join('、') })}
                </p>
              )}
              {shareError && (
                <p className="editor-error" role="alert">
                  {shareError}
                </p>
              )}
            </div>
            <div className="share-actions">
              <button
                className="share-action"
                disabled={shareBlockedPlayers.length > 0 || isSharing}
                onClick={() => void shareLineup()}
                type="button"
              >
                {isSharing
                  ? t('common.processing')
                  : sharedPostId
                    ? t('community.reshare')
                    : t('community.share')}
              </button>
              {sharedPostId && (
                <button
                  className="ghost"
                  onClick={() => onOpenSharedPost(sharedPostId)}
                  type="button"
                >
                  {t('community.viewShared')}
                </button>
              )}
            </div>
          </section>
        )}
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
  isCloudMode,
}: BattleProps) {
  const { i18n, t } = useTranslation();
  const locale: AppLocale = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-CN';
  const [homeId, setHomeId] = useState(lineups[0]?.id || '');
  const [awayId, setAwayId] = useState(lineups[1]?.id || '');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('local');
  const [credential, setCredential] = useState<LlmCredential | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const home = lineups.find((x) => x.id === homeId);
  const away = lineups.find((x) => x.id === awayId);
  const homeIsEligible = home ? validateLineup(home).isEligibleForSimulation : false;
  const awayIsEligible = away ? validateLineup(away).isEligibleForSimulation : false;
  const aiIsAvailable = isCloudMode && credential?.configured === true;

  // 每次进入对战页都读取最新的脱敏配置，从 AI 设置返回后无需刷新页面。
  useEffect(() => {
    if (!isCloudMode) return;
    void api
      .getLlmCredential()
      .then((saved) => {
        setCredential(saved);
        setCredentialError(null);
      })
      .catch((error: unknown) => {
        setCredentialError(error instanceof Error ? error.message : t('ai.readFailed'));
      });
  }, [isCloudMode]);

  // 本地引擎是始终可用的安全默认值；Key 被删除后不保留无效的 AI 选中状态。
  useEffect(() => {
    if (credential && !credential.configured) setSimulationMode('local');
  }, [credential]);

  return (
    <section className="page battle-page">
      <div className="battle-hero">
        <p className="eyebrow">SIMULATION LAB</p>
        <h1>{t('battle.title')}</h1>
        <p>{t('battle.subtitle')}</p>
        {isCloudMode && <p className="retention-summary">{t('battle.retention')}</p>}
        <div className="simulation-mode-section">
          <div className="simulation-mode-heading">
            <strong>{t('battle.chooseMode')}</strong>
            <span>{t('battle.defaultMode')}</span>
          </div>
          <div
            className="simulation-mode-options"
            role="radiogroup"
            aria-label={t('battle.chooseMode')}
          >
            <button
              aria-checked={simulationMode === 'local'}
              className={'simulation-mode-card ' + (simulationMode === 'local' ? 'selected' : '')}
              onClick={() => setSimulationMode('local')}
              role="radio"
              type="button"
            >
              <span className="mode-card-title">
                <strong>{t('battle.local')}</strong>
                <i>{t('battle.recommended')}</i>
              </span>
              <span>{t('battle.localInfo')}</span>
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
                <strong>{t('battle.aiMode')}</strong>
                <i className="experimental">{t('battle.experimental')}</i>
              </span>
              <span>
                {aiIsAvailable
                  ? t('battle.aiInfo', { model: credential.model })
                  : t('battle.aiUnavailable')}
              </span>
            </button>
          </div>
          {isCloudMode && credential && !credential.configured && (
            <div className="ai-setup-prompt">
              <span>{t('battle.aiNotConfigured')}</span>
              <button className="ghost" onClick={onOpenAiSettings} type="button">
                {t('battle.configureAi')}
              </button>
            </div>
          )}
          {credentialError && (
            <p className="mode-status-error" role="status">
              {t('battle.aiReadFailed')}
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
              ? t('battle.simulateSaving')
              : simulationMode === 'ai'
                ? t('battle.simulateAi')
                : t('battle.simulateLocal')}
          </button>
        </div>
      </div>
      {simulationError && (
        <p className="editor-error battle-error" role="alert">
          {simulationError}
        </p>
      )}
      {games.length > 0 && (
        <section className="report-history" aria-label={t('battle.reports')}>
          <div className="report-history-heading">
            <div>
              <p className="eyebrow">REPORT HISTORY</p>
              <h2>{t('battle.reports')}</h2>
            </div>
            <span>{t('battle.games', { count: games.length })}</span>
          </div>
          <div className="report-history-list">
            {games.map((report) => (
              <button
                className={report.id === game?.id ? 'selected' : ''}
                key={report.id}
                onClick={() => onSelectGame(report)}
              >
                <span>
                  <b>{report.homeLineupName ?? t('battle.home')}</b>
                  <strong>
                    {report.homeScore}–{report.awayScore}
                  </strong>
                  <b>{report.awayLineupName ?? t('battle.away')}</b>
                </span>
                <small>
                  {formatReportDate(new Date(report.createdAt), locale)} ·{' '}
                  {t('battle.savedUntil', {
                    date: formatReportDate(new Date(report.expiresAt), locale),
                  })}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}
      {game ? (
        <GameResult game={game} players={players} isCloudReport={isCloudMode} />
      ) : (
        <div className="empty large">{t('battle.selectFirst')}</div>
      )}
    </section>
  );
}

function GameResult({ game, players, isCloudReport }: GameResultProps) {
  const { i18n, t } = useTranslation();
  const locale: AppLocale = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-CN';
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
            {s.playerName ?? p?.name ?? t('battle.playerRemoved', { id: s.playerId })}
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
  const homeName = game.homeLineupName ?? t('battle.home');
  const awayName = game.awayLineupName ?? t('battle.away');
  const pog = selectPlayerOfTheGame(game);
  const pogPlayer = pog ? players.find((x) => x.id === pog.stat.playerId) : undefined;
  const pogIsHome = pog ? game.homeStats.some((s) => s.playerId === pog.stat.playerId) : false;
  const pogFgPct =
    pog && pog.stat.fgAttempted > 0
      ? Math.round((pog.stat.fgMade / pog.stat.fgAttempted) * 100)
      : 0;
  const engineLabel = game.engineVersion?.startsWith('llm:')
    ? t('battle.aiEngine', { model: game.engineVersion.slice(4) })
    : t('battle.localEngine');
  return (
    <div className="game-result">
      <div className={'report-retention ' + (expirationIsNear ? 'expires-soon' : '')}>
        <div>
          <strong>{isCloudReport ? t('battle.reportCloud') : t('battle.reportLocal')}</strong>
          <small className="report-engine">{engineLabel}</small>
        </div>
        <span>
          {t('battle.savedUntil', { date: formatReportDate(expiresAt, locale) })}
          {remainingDays > 0
            ? t('battle.daysRemaining', { count: remainingDays })
            : t('battle.expired')}
          {t('battle.cannotRecover')}
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
      {pog && (
        <div className="pog-card">
          <div className="pog-main">
            <i
              className="pog-avatar"
              style={{ background: pog.stat.playerAccent ?? pogPlayer?.accent ?? '#777' }}
            >
              {pog.stat.playerInitials ?? pogPlayer?.initials ?? '?'}
            </i>
            <div className="pog-info">
              <p className="eyebrow">{t('battle.playerOfTheGame')}</p>
              <b>
                {pog.stat.playerName ??
                  pogPlayer?.name ??
                  t('battle.playerRemoved', { id: pog.stat.playerId })}
              </b>
              <small>{pogIsHome ? homeName : awayName}</small>
            </div>
            <div className="pog-score">
              <strong>{pog.score.toFixed(1)}</strong>
              <small>{t('battle.pogScore')}</small>
            </div>
          </div>
          <p className="pog-stats">
            {pog.stat.minutes} MIN · {pog.stat.points} PTS · {pog.stat.rebounds} REB ·{' '}
            {pog.stat.assists} AST · {pog.stat.steals} STL · {pog.stat.blocks} BLK · {pogFgPct}% FG
          </p>
        </div>
      )}
      <div className="stat-columns">
        <StatTable name={homeName} rows={rows(game.homeStats)} />
        <StatTable name={awayName} rows={rows(game.awayStats)} />
      </div>
    </div>
  );
}
function StatTable({ name, rows }: StatTableProps) {
  const { t } = useTranslation();
  return (
    <div className="stat-table">
      <h3>{name}</h3>
      <table>
        <thead>
          <tr>
            <th>{t('common.player')}</th>
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

function CommunityHub({
  isAuthenticated,
  postId,
  onOpenPost,
  onClosePost,
  onRequireAuth,
  onCopied,
  onLineupsChanged,
}: CommunityHubProps) {
  if (postId) {
    return (
      <CommunityPostView
        isAuthenticated={isAuthenticated}
        onBack={onClosePost}
        onCopied={onCopied}
        onLineupsChanged={onLineupsChanged}
        onRequireAuth={onRequireAuth}
        postId={postId}
      />
    );
  }
  return <CommunityListView onOpen={onOpenPost} />;
}

function CommunityListView({ onOpen }: CommunityListViewProps) {
  const { i18n, t } = useTranslation();
  const locale: AppLocale = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-CN';
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResponse<CommunityPostSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // 翻页或重试时重新向服务端请求；社区列表的分页在服务端完成，本地不再切片。
  useEffect(() => {
    let cancelled = false;
    api
      .listCommunityPosts(page, COMMUNITY_PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : t('errors.unknown');
        setError(t('community.loadFailed', { message }));
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadTick]);

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / COMMUNITY_PAGE_SIZE));

  return (
    <section className="page community-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMMUNITY</p>
          <h1>{t('community.title')}</h1>
          <p>{t('community.subtitle')}</p>
        </div>
      </div>
      {error && (
        <p className="editor-error" role="alert">
          {error}{' '}
          <button className="ghost" onClick={() => setReloadTick((tick) => tick + 1)} type="button">
            {t('common.retry')}
          </button>
        </p>
      )}
      {!data && !error && <div className="empty">{t('community.loading')}</div>}
      {data && data.items.length === 0 && <div className="empty large">{t('community.empty')}</div>}
      <div className="community-list">
        {data?.items.map((post) => (
          <button
            className="community-card"
            key={post.id}
            onClick={() => onOpen(post.id)}
            type="button"
          >
            <span className="community-card-main">
              <b>{post.name}</b>
              {post.description && <small>{post.description}</small>}
              <em>{t('community.byAuthor', { name: post.authorName })}</em>
            </span>
            <span className="community-card-meta">
              <span>{t('community.members', { count: post.memberCount })}</span>
              <span>{t('community.comments', { count: post.commentCount })}</span>
              <span>{t('community.copies', { count: post.copyCount })}</span>
              <small>{formatReportDate(new Date(post.createdAt), locale)}</small>
            </span>
          </button>
        ))}
      </div>
      {data && (
        <PaginationBar onChange={setPage} page={page} pageCount={pageCount} total={data.total} />
      )}
    </section>
  );
}

function CommunityPostView({
  postId,
  isAuthenticated,
  onBack,
  onRequireAuth,
  onCopied,
  onLineupsChanged,
}: CommunityPostViewProps) {
  const { i18n, t } = useTranslation();
  const locale: AppLocale = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-CN';
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [comments, setComments] = useState<PagedResponse<CommunityComment> | null>(null);
  const [commentPage, setCommentPage] = useState(1);
  const [commentLoadError, setCommentLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getCommunityPost(postId)
      .then((detail) => {
        if (cancelled) return;
        setPost(detail);
        setPostError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : t('errors.unknown');
        setPostError(t('community.loadFailed', { message }));
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    api
      .listCommunityComments(postId, commentPage, COMMENT_PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setComments(result);
        setCommentLoadError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : t('errors.unknown');
        setCommentLoadError(t('community.loadFailed', { message }));
      });
    return () => {
      cancelled = true;
    };
  }, [postId, commentPage]);

  // 评论、删除、撤回之后帖子的计数都会变化，帖子和评论一起重新拉取保持一致。
  const reloadAfterAction = async (page: number) => {
    const [detail, commentPageData] = await Promise.all([
      api.getCommunityPost(postId),
      api.listCommunityComments(postId, page, COMMENT_PAGE_SIZE),
    ]);
    setPost(detail);
    setComments(commentPageData);
  };

  const submitComment = async () => {
    const content = draft.trim();
    if (!content) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.addCommunityComment(postId, content, replyTo?.id ?? null);
      setDraft('');
      setReplyTo(null);
      setCommentPage(1);
      await reloadAfterAction(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setActionError(t('community.commentFailed', { message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeComment = async (comment: CommunityComment) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.deleteCommunityComment(comment.id);
      await reloadAfterAction(commentPage);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setActionError(t('community.commentFailed', { message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const lineup = await api.copyCommunityPost(postId);
      onCopied(lineup);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setActionError(t('community.copyFailed', { message }));
      setIsSubmitting(false);
    }
  };

  const withdraw = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.withdrawCommunityPost(postId);
      await onLineupsChanged();
      onBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setActionError(t('community.withdrawFailed', { message }));
      setIsSubmitting(false);
    }
  };

  if (postError) {
    return (
      <section className="page community-page">
        <button className="ghost" onClick={onBack} type="button">
          ← {t('community.back')}
        </button>
        <p className="editor-error" role="alert">
          {postError}
        </p>
      </section>
    );
  }
  if (!post) {
    return (
      <section className="page community-page">
        <div className="empty">{t('community.loading')}</div>
      </section>
    );
  }

  const commentPageCount = Math.max(1, Math.ceil((comments?.total ?? 0) / COMMENT_PAGE_SIZE));

  return (
    <section className="page community-page community-detail">
      <button className="ghost community-back" onClick={onBack} type="button">
        ← {t('community.back')}
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('community.byAuthor', { name: post.authorName })}</p>
          <h1>{post.name}</h1>
          {post.description && <p>{post.description}</p>}
          <p className="community-meta">
            {t('community.members', { count: post.memberCount })} ·{' '}
            {t('community.comments', { count: post.commentCount })} ·{' '}
            {t('community.copies', { count: post.copyCount })} ·{' '}
            {t('community.sharedAt', { date: formatReportDate(new Date(post.createdAt), locale) })}
          </p>
        </div>
        <div className="page-heading-actions">
          {post.mine && (
            <button
              className="secondary danger-button"
              disabled={isSubmitting}
              onClick={() => void withdraw()}
              type="button"
            >
              {t('community.withdraw')}
            </button>
          )}
          <button
            className="primary"
            disabled={isSubmitting}
            onClick={() => (isAuthenticated ? void copy() : onRequireAuth())}
            type="button"
          >
            {t('community.copy')}
          </button>
        </div>
      </div>
      {actionError && (
        <p className="editor-error" role="alert">
          {actionError}
        </p>
      )}
      <div className="roster-table community-members">
        <div className="roster-row header">
          <span>{t('common.player')}</span>
          <span>{t('common.position')}</span>
          <span>{t('common.role')}</span>
          <span>{t('common.status')}</span>
        </div>
        {post.members.map((member) => (
          <div className="roster-row" key={member.playerId}>
            <span className="name-cell">
              <i style={{ background: member.player.accent }}>{member.player.initials}</i>
              <b>
                {member.player.name}
                <small>
                  {average(member.player)} OVR · {member.player.archetype}
                </small>
              </b>
            </span>
            <span>{member.position}</span>
            <span>{member.starter ? t('common.starter') : t('common.bench')}</span>
            <span>{member.inactive ? t('common.inactive') : t('common.active')}</span>
          </div>
        ))}
      </div>
      <section aria-label={t('community.commentsTitle')} className="comments">
        <div className="picker-heading">
          <div>
            <p className="eyebrow">DISCUSSION</p>
            <h2>{t('community.commentsTitle')}</h2>
          </div>
          <span>{t('community.comments', { count: comments?.total ?? 0 })}</span>
        </div>
        {commentLoadError && (
          <p className="editor-error" role="alert">
            {commentLoadError}
          </p>
        )}
        <div className="comment-list">
          {comments?.items.map((comment) => (
            <div className="comment" key={comment.id}>
              <div className="comment-meta">
                <b>{comment.authorName}</b>
                {comment.parentAuthorName && (
                  <span>{t('community.replyTo', { name: comment.parentAuthorName })}</span>
                )}
                <small>{formatReportDate(new Date(comment.createdAt), locale)}</small>
                {isAuthenticated && (
                  <button className="ghost" onClick={() => setReplyTo(comment)} type="button">
                    {t('community.reply')}
                  </button>
                )}
                {comment.mine && (
                  <button
                    className="ghost"
                    disabled={isSubmitting}
                    onClick={() => void removeComment(comment)}
                    type="button"
                  >
                    {t('community.deleteComment')}
                  </button>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          ))}
          {comments && comments.items.length === 0 && (
            <p className="picker-empty">{t('community.noComments')}</p>
          )}
        </div>
        {comments && (
          <PaginationBar
            onChange={setCommentPage}
            page={commentPage}
            pageCount={commentPageCount}
            total={comments.total}
          />
        )}
        {isAuthenticated ? (
          <div className="comment-form">
            {replyTo && (
              <p className="reply-hint">
                {t('community.replyTo', { name: replyTo.authorName })}
                <button className="ghost" onClick={() => setReplyTo(null)} type="button">
                  {t('community.cancelReply')}
                </button>
              </p>
            )}
            <textarea
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('community.commentPlaceholder')}
              value={draft}
            />
            <button
              className="primary"
              disabled={isSubmitting || !draft.trim()}
              onClick={() => void submitComment()}
              type="button"
            >
              {isSubmitting ? t('common.processing') : t('community.submitComment')}
            </button>
          </div>
        ) : (
          <div className="ai-setup-prompt">
            <span>{t('community.loginToInteract')}</span>
            <button className="ghost" onClick={onRequireAuth} type="button">
              {t('guest.login')}
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
