import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { format } from 'prettier';

const START_SEASON = 1978;
const END_SEASON = 2026;

const sources = {
  allStars:
    'https://raw.githubusercontent.com/sumitrodatta/bball-reference-datasets/master/Data/All-Star%20Selections.csv',
  endOfSeasonTeams:
    'https://raw.githubusercontent.com/sumitrodatta/bball-reference-datasets/master/Data/End%20of%20Season%20Teams.csv',
  perGame:
    'https://raw.githubusercontent.com/sumitrodatta/bball-reference-datasets/master/Data/Player%20Per%20Game.csv',
  advanced:
    'https://raw.githubusercontent.com/sumitrodatta/bball-reference-datasets/master/Data/Advanced.csv',
  careerInfo:
    'https://raw.githubusercontent.com/sumitrodatta/bball-reference-datasets/master/Data/Player%20Career%20Info.csv',
};

// NBA.com lists 76 players because the 75th Anniversary Team voting ended in a tie.
const nba75Names = [
  'Kareem Abdul-Jabbar',
  'Ray Allen',
  'Giannis Antetokounmpo',
  'Carmelo Anthony',
  'Nate Archibald',
  'Paul Arizin',
  'Charles Barkley',
  'Rick Barry',
  'Elgin Baylor',
  'Dave Bing',
  'Larry Bird',
  'Kobe Bryant',
  'Wilt Chamberlain',
  'Bob Cousy',
  'Dave Cowens',
  'Billy Cunningham',
  'Stephen Curry',
  'Anthony Davis',
  'Dave DeBusschere',
  'Clyde Drexler',
  'Tim Duncan',
  'Kevin Durant',
  'Julius Erving',
  'Patrick Ewing',
  'Walt Frazier',
  'Kevin Garnett',
  'George Gervin',
  'Hal Greer',
  'James Harden',
  'John Havlicek',
  'Elvin Hayes',
  'Allen Iverson',
  'LeBron James',
  'Magic Johnson',
  'Sam Jones',
  'Michael Jordan',
  'Jason Kidd',
  'Kawhi Leonard',
  'Damian Lillard',
  'Jerry Lucas',
  'Karl Malone',
  'Moses Malone',
  'Pete Maravich',
  'Bob McAdoo',
  'Kevin McHale',
  'George Mikan',
  'Reggie Miller',
  'Earl Monroe',
  'Steve Nash',
  'Dirk Nowitzki',
  "Shaquille O'Neal",
  'Hakeem Olajuwon',
  'Robert Parish',
  'Chris Paul',
  'Gary Payton',
  'Bob Pettit',
  'Paul Pierce',
  'Scottie Pippen',
  'Willis Reed',
  'Oscar Robertson',
  'David Robinson',
  'Dennis Rodman',
  'Bill Russell',
  'Dolph Schayes',
  'Bill Sharman',
  'John Stockton',
  'Isiah Thomas',
  'Nate Thurmond',
  'Wes Unseld',
  'Dwyane Wade',
  'Bill Walton',
  'Jerry West',
  'Russell Westbrook',
  'Lenny Wilkens',
  'Dominique Wilkins',
  'James Worthy',
];

// The upstream awards dataset currently ends in 2025. These official NBA.com
// selections complete the requested 2025-26 season until the source refreshes.
const allNba2026 = [
  'Shai Gilgeous-Alexander',
  'Nikola Jokić',
  'Victor Wembanyama',
  'Luka Dončić',
  'Cade Cunningham',
  'Jaylen Brown',
  'Kawhi Leonard',
  'Donovan Mitchell',
  'Kevin Durant',
  'Jalen Brunson',
  'Tyrese Maxey',
  'Jamal Murray',
  'Jalen Johnson',
  'Chet Holmgren',
  'Jalen Duren',
];

const allDefense2026 = [
  'Victor Wembanyama',
  'Chet Holmgren',
  'Ausar Thompson',
  'Rudy Gobert',
  'Derrick White',
  'Scottie Barnes',
  'Cason Wallace',
  'Bam Adebayo',
  'OG Anunoby',
  'Dyson Daniels',
];

const nameAliases = new Map([['Nate Archibald', 'Tiny Archibald']]);

const teamNames = {
  ATL: 'Atlanta',
  BKN: 'Brooklyn',
  BOS: 'Boston',
  BRK: 'Brooklyn',
  CHA: 'Charlotte',
  CHH: 'Charlotte',
  CHI: 'Chicago',
  CHO: 'Charlotte',
  CLE: 'Cleveland',
  DAL: 'Dallas',
  DEN: 'Denver',
  DET: 'Detroit',
  GSW: 'Golden State',
  HOU: 'Houston',
  IND: 'Indiana',
  KCK: 'Kansas City',
  LAC: 'Los Angeles',
  LAL: 'Los Angeles',
  MEM: 'Memphis',
  MIA: 'Miami',
  MIL: 'Milwaukee',
  MIN: 'Minnesota',
  NJN: 'New Jersey',
  NOH: 'New Orleans',
  NOK: 'New Orleans',
  NOP: 'New Orleans',
  NYK: 'New York',
  OKC: 'Oklahoma City',
  ORL: 'Orlando',
  PHI: 'Philadelphia',
  PHO: 'Phoenix',
  POR: 'Portland',
  SAC: 'Sacramento',
  SAS: 'San Antonio',
  SEA: 'Seattle',
  TOR: 'Toronto',
  UTA: 'Utah',
  VAN: 'Vancouver',
  WAS: 'Washington',
  WSB: 'Washington',
  BAL: 'Baltimore',
  BLB: 'Baltimore',
  BUF: 'Buffalo',
  CAP: 'Washington',
  CIN: 'Cincinnati',
  FTW: 'Fort Wayne',
  KCO: 'Kansas City-Omaha',
  MNL: 'Minneapolis',
  NOJ: 'New Orleans',
  PHW: 'Philadelphia',
  ROC: 'Rochester',
  SFW: 'San Francisco',
  STL: 'St. Louis',
  SYR: 'Syracuse',
};

const accentPalette = [
  '#c3ec8b',
  '#f3c969',
  '#ef8c72',
  '#76b5e8',
  '#b59e72',
  '#9c8dee',
  '#72b58a',
  '#e67b9f',
  '#65a9a3',
  '#d9b146',
  '#758f74',
  '#8060bf',
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])),
  );
}

async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch ${url}: HTTP ${response.status}`);
  return parseCsv(await response.text());
}

async function loadCsv(sourceKey, localFileName) {
  const localDirectory = process.env.NBA_DATA_DIR;
  if (localDirectory) {
    return parseCsv(await readFile(resolve(localDirectory, localFileName), 'utf8'));
  }
  return fetchCsv(sources[sourceKey]);
}

function normalizedName(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasNumber(value) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
}

function clamp(value, minimum = 25, maximum = 99) {
  return Math.round(Math.min(maximum, Math.max(minimum, value)));
}

function seasonLabel(endYear) {
  return `${endYear - 1}–${String(endYear).slice(-2)}`;
}

function positionFor(row, career) {
  const source = row.pos || career.pos || '';
  const primary = source.split('-')[0];
  if (['PG', 'SG', 'SF', 'PF', 'C'].includes(primary)) return primary;
  if (primary === 'G') return number(row.ast_per_game) >= 4.5 ? 'PG' : 'SG';
  if (primary === 'F') return number(career.ht_in_in) >= 80 ? 'PF' : 'SF';
  return number(career.ht_in_in) >= 81 ? 'C' : 'SF';
}

function initialsFor(name) {
  const ignored = new Set(['jr', 'jr.', 'ii', 'iii', 'iv']);
  const parts = name.split(/\s+/).filter((part) => !ignored.has(part.toLowerCase()));
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase().slice(0, 4);
}

function peakScore(perGame, advanced) {
  return (
    number(advanced.bpm) * 2.4 +
    number(advanced.vorp) * 1.8 +
    number(advanced.ws) * 0.7 +
    number(advanced.per) * 0.8 +
    number(perGame.pts_per_game) * 0.55 +
    number(perGame.trb_per_game) * 0.25 +
    number(perGame.ast_per_game) * 0.4 +
    (number(perGame.stl_per_game) + number(perGame.blk_per_game)) * 0.7
  );
}

function choosePeakSeason(playerId, perGameRows, advancedByKey) {
  const rows = perGameRows.filter((row) => row.player_id === playerId && row.lg === 'NBA');
  const rowsBySeason = new Map();
  for (const row of rows) {
    const season = rowsBySeason.get(row.season) ?? [];
    season.push(row);
    rowsBySeason.set(row.season, season);
  }

  // A traded player has one *TM aggregate row plus one row per team for that
  // season. Pick exactly one representative for every season so a trade in one
  // year cannot hide the rest of the player's career from the peak comparison.
  const seasonRows = [...rowsBySeason.values()].map(
    (season) =>
      season.find((row) => /TM$/.test(row.team)) ??
      season.sort((left, right) => number(right.g) - number(left.g))[0],
  );
  const qualified = seasonRows.filter((row) => number(row.g) >= 35);
  const pool = qualified.length ? qualified : seasonRows;

  return pool
    .map((perGame) => ({
      perGame,
      advanced:
        advancedByKey.get(`${playerId}:${perGame.season}:${perGame.team}`) ??
        advancedByKey.get(`${playerId}:${perGame.season}:TOTAL`) ??
        {},
    }))
    .sort(
      (left, right) =>
        peakScore(right.perGame, right.advanced) - peakScore(left.perGame, left.advanced),
    )[0];
}

function peakTeamFor(peak, perGameRows) {
  const { player_id: playerId, season, team } = peak.perGame;
  if (!/TM$/.test(team)) return teamNames[team] ?? team;
  const teamRow = perGameRows
    .filter((row) => row.player_id === playerId && row.season === season && !/TM$/.test(row.team))
    .sort((left, right) => number(right.g) - number(left.g))[0];
  return teamNames[teamRow?.team] ?? teamRow?.team ?? 'Multiple teams';
}

function createRatings(peak, career, position, defenseSelections, isNba75) {
  const p = peak.perGame;
  const a = peak.advanced;
  const height = number(career.ht_in_in, 78);
  const weight = number(career.wt, 210);
  const season = number(p.season);
  const threeAttempts = number(p.x3pa_per_game);
  const threePercent = number(p.x3p_percent, 0.28);
  const twoPercent = number(p.x2p_percent, number(p.fg_percent, 0.45));
  const freeThrowPercent = number(p.ft_percent, 0.7);
  const points = number(p.pts_per_game);
  const assists = number(p.ast_per_game);
  const totalRebounds = number(p.trb_per_game);
  const minutes = number(p.mp_per_game, 24);
  const per = number(a.per, 15);
  const bpm = number(a.bpm);
  const offensiveBpm = number(a.obpm);
  const defensiveBpm = number(a.dbpm);
  const usage = number(a.usg_percent, 18);
  const assistPercent = number(a.ast_percent, assists * 3.5);
  const isGuard = position === 'PG' || position === 'SG';
  const isBig = position === 'PF' || position === 'C';
  // Steals, blocks and rebound splits were not recorded before 1973-74. Use
  // conservative position/rebounding estimates instead of treating missing
  // historical statistics as zero.
  const steals = hasNumber(p.stl_per_game) ? number(p.stl_per_game) : isGuard ? 1.35 : 0.9;
  const blocks = hasNumber(p.blk_per_game)
    ? number(p.blk_per_game)
    : isBig
      ? Math.min(3.5, 0.65 + totalRebounds * 0.13)
      : 0.5;
  const offensiveRebounds = hasNumber(p.orb_per_game)
    ? number(p.orb_per_game)
    : totalRebounds * (isBig ? 0.38 : 0.3);
  const defensiveRebounds = hasNumber(p.drb_per_game)
    ? number(p.drb_per_game)
    : Math.max(0, totalRebounds - offensiveRebounds);
  const offensiveReboundPercent = hasNumber(a.orb_percent)
    ? number(a.orb_percent)
    : offensiveRebounds * 2.2;
  const defensiveReboundPercent = hasNumber(a.drb_percent)
    ? number(a.drb_percent)
    : defensiveRebounds * 2.2;
  const stealPercent = hasNumber(a.stl_percent) ? number(a.stl_percent) : steals;
  const blockPercent = hasNumber(a.blk_percent) ? number(a.blk_percent) : blocks * 1.6;
  const defenseBonus = Math.min(14, defenseSelections * 1.6);
  const legacyDefenseBonus = season < 1974 && isNba75 ? (isBig ? 16 : 6) : 0;
  const perimeterEra = season >= 1980;

  return {
    threePoint:
      perimeterEra && threeAttempts >= 0.4
        ? clamp(42 + threePercent * 105 + Math.min(15, threeAttempts * 2.2))
        : clamp(28 + freeThrowPercent * 18, 25, 55),
    layup: clamp(48 + twoPercent * 62 + (isGuard ? 6 : 0) + Math.min(8, points / 4)),
    midRange: clamp(42 + freeThrowPercent * 45 + Math.min(14, points / 2.8) - threeAttempts * 0.5),
    insideScoring: clamp(40 + twoPercent * 62 + (isBig ? 10 : 0) + offensiveRebounds * 2),
    dunk: clamp(38 + (height - 72) * 2.4 + (isBig ? 10 : 0) + blocks * 3),
    offensiveRebound: clamp(45 + offensiveReboundPercent * 4.2),
    defensiveRebound: clamp(45 + defensiveReboundPercent * 2.6),
    handling: clamp(48 + assistPercent * 1.15 + (isGuard ? 14 : 0) - (height - 78) * 0.5),
    passing: clamp(50 + assistPercent * 1.35 + assists * 1.8),
    defensiveIQ: clamp(
      62 +
        defensiveBpm * 4.5 +
        defenseBonus +
        legacyDefenseBonus +
        Math.min(10, totalRebounds / 1.8) +
        Math.min(8, number(a.dws)),
    ),
    offensiveIQ: clamp(55 + per * 1.15 + offensiveBpm * 3 + Math.min(8, assists)),
    speed: clamp(88 - (height - 72) * 1.35 + (isGuard ? 5 : 0) + steals * 2.4),
    agility: clamp(86 - (height - 72) * 1.05 + (isGuard ? 6 : 0) + stealPercent * 2),
    vertical: clamp(60 + blocks * 7 + offensiveRebounds * 2 + (height < 80 ? 7 : 0)),
    strength: clamp(45 + (weight - 160) * 0.38 + (isBig ? 8 : 0)),
    freeThrow: clamp(25 + freeThrowPercent * 74),
    steal: clamp(45 + stealPercent * 16 + defenseBonus * 0.5),
    block: clamp(42 + blockPercent * 10 + defenseBonus * 0.45 + legacyDefenseBonus),
    stamina: clamp(45 + minutes * 1.35 + Math.min(8, number(p.g) / 10)),
    shotTendency: clamp(42 + usage * 1.9 + points * 0.5),
  };
}

function describePlayer(ratings, position) {
  const traits = [
    ['passing', 'Playmaking'],
    ['threePoint', 'Shooting'],
    ['insideScoring', 'Interior scoring'],
    ['defensiveIQ', 'Two-way'],
    ['offensiveRebound', 'Rebounding'],
    ['block', 'Rim protection'],
  ].sort((left, right) => ratings[right[0]] - ratings[left[0]]);
  const role =
    position === 'C'
      ? 'center'
      : position === 'PF'
        ? 'forward'
        : position === 'PG'
          ? 'guard'
          : 'wing';
  return `${traits[0][1]} ${role}`;
}

function deterministicUuid(value) {
  const hex = createHash('sha256').update(`dream-court:${value}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function sql(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function renderTypeScript(players, coverage) {
  return `import type { Player } from '@/types';

// Generated by scripts/generate-nba-history-catalog.mjs from the sources documented in
// src/data/README.md. Hand edits will be overwritten the next time the catalog is refreshed.
export const historicalPlayers: Player[] = ${JSON.stringify(players, null, 2)};

export const historicalCatalogCoverage = ${JSON.stringify(coverage, null, 2)} as const;
`;
}

function renderMigration(players) {
  const ratingColumns = [
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
    'speed',
    'agility',
    'vertical',
    'strength',
    'freeThrow',
    'steal',
    'block',
    'stamina',
    'shotTendency',
  ];
  const rows = players.map((player) => {
    const values = [
      deterministicUuid(player.id),
      player.id,
      false,
      player.name,
      player.initials,
      player.peakSeason,
      player.peakTeam,
      player.defaultPosition,
      player.heightFeet,
      player.heightInches,
      player.weightLbs,
      player.salaryUsd,
      player.archetype,
      player.bio,
      player.accent,
      ...ratingColumns.map((key) => player[key]),
    ];
    return `  (${values.map(sql).join(', ')})`;
  });

  return `-- Generated from the same historical catalog as the browser seed data.
-- Existing user overrides remain untouched because they live in player_overrides.
insert into players (
  id, catalog_key, is_custom, name, initials, peak_season, peak_team, default_position,
  height_feet, height_inches, weight_lbs, salary_usd, archetype, bio, accent,
  three_point, layup, mid_range, inside_scoring, dunk, offensive_rebound, defensive_rebound,
  handling, passing, defensive_iq, offensive_iq, speed, agility, vertical, strength,
  free_throw, steal, block, stamina, shot_tendency
)
values
${rows.join(',\n')}
on conflict (catalog_key) do update set
  name = excluded.name,
  initials = excluded.initials,
  peak_season = excluded.peak_season,
  peak_team = excluded.peak_team,
  default_position = excluded.default_position,
  height_feet = excluded.height_feet,
  height_inches = excluded.height_inches,
  weight_lbs = excluded.weight_lbs,
  salary_usd = excluded.salary_usd,
  archetype = excluded.archetype,
  bio = excluded.bio,
  accent = excluded.accent,
  three_point = excluded.three_point,
  layup = excluded.layup,
  mid_range = excluded.mid_range,
  inside_scoring = excluded.inside_scoring,
  dunk = excluded.dunk,
  offensive_rebound = excluded.offensive_rebound,
  defensive_rebound = excluded.defensive_rebound,
  handling = excluded.handling,
  passing = excluded.passing,
  defensive_iq = excluded.defensive_iq,
  offensive_iq = excluded.offensive_iq,
  speed = excluded.speed,
  agility = excluded.agility,
  vertical = excluded.vertical,
  strength = excluded.strength,
  free_throw = excluded.free_throw,
  steal = excluded.steal,
  block = excluded.block,
  stamina = excluded.stamina,
  shot_tendency = excluded.shot_tendency,
  updated_at = now();

-- Align the one legacy curly-apostrophe seed with the catalog naming convention.
update players set name = 'Shaquille O''Neal' where catalog_key = 'shaq';
`;
}

function assertSeasonCoverage(label, seasons, expected) {
  const missing = expected.filter((season) => !seasons.includes(season));
  if (missing.length) throw new Error(`${label} is missing seasons: ${missing.join(', ')}`);
}

async function main() {
  const [allStars, endTeams, perGameRows, advancedRows, careerRows, curatedSource] =
    await Promise.all([
      loadCsv('allStars', 'all-stars.csv'),
      loadCsv('endOfSeasonTeams', 'teams.csv'),
      loadCsv('perGame', 'per-game.csv'),
      loadCsv('advanced', 'advanced.csv'),
      loadCsv('careerInfo', 'career-info.csv'),
      readFile(resolve('src/data/players.ts'), 'utf8'),
    ]);

  const careerById = new Map(careerRows.map((row) => [row.player_id, row]));
  const careerByName = new Map();
  for (const row of careerRows) {
    const key = normalizedName(row.player);
    const current = careerByName.get(key);
    // Basketball Reference can contain a father and son under the same display
    // name (Patrick Ewing is one example). For honor-list name lookups, prefer
    // the player with the longer NBA career instead of whichever CSV row is last.
    const careerLength = number(row.to) - number(row.from);
    const currentLength = current ? number(current.to) - number(current.from) : -1;
    if (!current || careerLength > currentLength) careerByName.set(key, row);
  }
  const officialNameById = new Map();
  const sourcePlayerIds = {
    nba75: new Set(),
    allStars: new Set(),
    allNba: new Set(),
    allDefense: new Set(),
  };
  const seasons = { allStars: new Set(), allNba: new Set(), allDefense: new Set() };

  for (const officialName of nba75Names) {
    const lookupName = nameAliases.get(officialName) ?? officialName;
    const career = careerByName.get(normalizedName(lookupName));
    if (!career) throw new Error(`NBA 75 player not found: ${officialName}`);
    sourcePlayerIds.nba75.add(career.player_id);
    officialNameById.set(career.player_id, officialName);
  }

  for (const row of allStars) {
    const season = number(row.season);
    if (row.lg !== 'NBA' || season < START_SEASON || season > END_SEASON) continue;
    sourcePlayerIds.allStars.add(row.player_id);
    seasons.allStars.add(season);
  }

  for (const row of endTeams) {
    const season = number(row.season);
    if (row.lg !== 'NBA' || season < START_SEASON || season > END_SEASON) continue;
    if (row.type === 'All-NBA') {
      sourcePlayerIds.allNba.add(row.player_id);
      seasons.allNba.add(season);
    }
    if (row.type === 'All-Defense') {
      sourcePlayerIds.allDefense.add(row.player_id);
      seasons.allDefense.add(season);
    }
  }

  for (const [type, names] of [
    ['allNba', allNba2026],
    ['allDefense', allDefense2026],
  ]) {
    for (const name of names) {
      const career = careerByName.get(normalizedName(name));
      if (!career) throw new Error(`2026 ${type} player not found: ${name}`);
      sourcePlayerIds[type].add(career.player_id);
    }
    seasons[type].add(END_SEASON);
  }

  const expectedAllStarSeasons = Array.from(
    { length: END_SEASON - START_SEASON + 1 },
    (_, index) => START_SEASON + index,
  ).filter((season) => season !== 1999);
  const expectedAnnualSeasons = Array.from(
    { length: END_SEASON - START_SEASON + 1 },
    (_, index) => START_SEASON + index,
  );
  assertSeasonCoverage('All-Star', [...seasons.allStars], expectedAllStarSeasons);
  assertSeasonCoverage('All-NBA', [...seasons.allNba], expectedAnnualSeasons);
  assertSeasonCoverage('All-Defense', [...seasons.allDefense], expectedAnnualSeasons);
  if (sourcePlayerIds.nba75.size !== 76) {
    throw new Error(`NBA 75 should contain 76 unique players, found ${sourcePlayerIds.nba75.size}`);
  }

  const selectedIds = new Set(Object.values(sourcePlayerIds).flatMap((set) => [...set]));
  const curatedNames = new Set(
    [...curatedSource.matchAll(/\bname:\s*(['"])(.*?)\1,/g)].map((match) =>
      normalizedName(match[2]),
    ),
  );
  const advancedByKey = new Map();
  for (const row of advancedRows) {
    if (row.lg !== 'NBA') continue;
    advancedByKey.set(`${row.player_id}:${row.season}:${row.team}`, row);
    if (/TM$/.test(row.team)) advancedByKey.set(`${row.player_id}:${row.season}:TOTAL`, row);
  }
  const defenseSelectionCounts = new Map();
  for (const row of endTeams) {
    if (row.lg === 'NBA' && row.type === 'All-Defense') {
      defenseSelectionCounts.set(
        row.player_id,
        (defenseSelectionCounts.get(row.player_id) ?? 0) + 1,
      );
    }
  }
  for (const name of allDefense2026) {
    const id = careerByName.get(normalizedName(name))?.player_id;
    if (id) defenseSelectionCounts.set(id, (defenseSelectionCounts.get(id) ?? 0) + 1);
  }

  const historicalPlayers = [...selectedIds]
    .map((playerId) => {
      const career = careerById.get(playerId);
      const peak = choosePeakSeason(playerId, perGameRows, advancedByKey);
      if (!career || !peak) throw new Error(`Missing career or season data for ${playerId}`);
      const name = officialNameById.get(playerId) ?? career.player;
      const position = positionFor(peak.perGame, career);
      const ratings = createRatings(
        peak,
        career,
        position,
        defenseSelectionCounts.get(playerId) ?? 0,
        sourcePlayerIds.nba75.has(playerId),
      );
      const heightInches = number(career.ht_in_in, 78);
      const accentIndex = Number.parseInt(
        createHash('sha1').update(playerId).digest('hex').slice(0, 4),
        16,
      );
      return {
        id: playerId,
        name,
        initials: initialsFor(name),
        peakSeason: seasonLabel(number(peak.perGame.season)),
        peakTeam: peakTeamFor(peak, perGameRows),
        defaultPosition: position,
        heightFeet: Math.floor(heightInches / 12),
        heightInches: heightInches % 12,
        weightLbs: number(career.wt, 210),
        salaryUsd: 0,
        archetype: describePlayer(ratings, position),
        bio: `Peak ${seasonLabel(number(peak.perGame.season))} profile derived from regular-season production and career honors.`,
        accent: accentPalette[accentIndex % accentPalette.length],
        ...ratings,
      };
    })
    .filter((player) => !curatedNames.has(normalizedName(player.name)))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));

  const canonicalName = (id) => officialNameById.get(id) ?? careerById.get(id)?.player ?? id;
  const coverage = {
    requestedRange: [START_SEASON, END_SEASON],
    nba75Count: sourcePlayerIds.nba75.size,
    allStarSeasons: [...seasons.allStars].sort(),
    allNbaSeasons: [...seasons.allNba].sort(),
    allDefenseSeasons: [...seasons.allDefense].sort(),
    sourceNames: Object.fromEntries(
      Object.entries(sourcePlayerIds).map(([key, ids]) => [
        key,
        [...ids].map(canonicalName).sort((left, right) => left.localeCompare(right, 'en')),
      ]),
    ),
  };

  const typescriptPath = resolve('src/data/historical-players.generated.ts');
  const migrationPath = resolve(
    'backend/src/main/resources/db/migration/V9__seed_historical_player_catalog.sql',
  );
  await mkdir(dirname(typescriptPath), { recursive: true });
  await mkdir(dirname(migrationPath), { recursive: true });
  const typeScriptSource = await format(renderTypeScript(historicalPlayers, coverage), {
    parser: 'typescript',
    printWidth: 100,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
  });
  await writeFile(typescriptPath, typeScriptSource);
  await writeFile(migrationPath, renderMigration(historicalPlayers));
  process.stdout.write(
    `Generated ${historicalPlayers.length} new players; ${selectedIds.size} unique requested players before curated deduplication.\n`,
  );
}

await main();
