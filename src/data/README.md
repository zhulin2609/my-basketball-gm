# NBA historical player catalog

`historical-players.generated.ts` and the matching Flyway `V9` migration are generated
artifacts. Do not edit either file by hand.

## Scope

- NBA 75th Anniversary Team: 76 players because the final vote was tied.
- NBA All-Star selections from 1978 through 2026. The 1999 season has no roster because
  the game was cancelled during the lockout.
- All-NBA and All-Defensive teams from 1978 through 2026.
- NBA Finals MVP winners from 1978 through 2026. The upstream dataset has no Finals MVP
  table, so the winners are listed explicitly in the generator.
- A player appearing in multiple sources or seasons is stored once.

## Sources and peak selection

Historical roster membership and regular-season statistics come from the public
[`bball-reference-datasets`](https://github.com/sumitrodatta/bball-reference-datasets)
snapshot. Coverage is checked against NBA.com's official
[75th Anniversary Team](https://www.nba.com/nba-75-anniversary-team),
[All-NBA history](https://www.nba.com/news/history-all-nba-teams), and
[All-Defensive history](https://www.nba.com/news/history-all-defensive-team). The 2026
All-NBA and All-Defensive selections are explicitly recorded from the official NBA.com
announcements because the upstream awards snapshot may lag the current season.

For each unique player, the generator compares every qualifying NBA season using a
stable composite of BPM, VORP, win shares, PER and per-game production. The highest
scoring season becomes the player's peak profile. A traded season uses its aggregate
`*TM` row; all other seasons remain eligible. Ratings are deterministic transformations
of that peak season, physical measurements and defensive honors. Missing pre-1974
steal, block and rebound-split statistics use conservative position-based estimates
instead of being treated as zero.

Salary is intentionally left unavailable for generated historical profiles because the
source does not provide a comparable cross-era salary series. The UI renders this as
`—` rather than inventing a value.

## Refresh

Run:

```bash
npm run data:generate-nba-history
```

The command downloads the latest source CSV files. For an offline/reproducible refresh,
set `NBA_DATA_DIR` to a directory containing `all-stars.csv`, `teams.csv`,
`per-game.csv`, `advanced.csv`, and `career-info.csv` before running the command.

A refresh rewrites `V9__seed_historical_player_catalog.sql`. Databases that already
applied the previous V9 must re-apply it once so Flyway records the new checksum and
picks up newly added players; V9 is an idempotent upsert, so re-running it does not
touch existing rows differently. For each local database:

```bash
psql -U zhulin -d basketball_gm_dev \
  -c "delete from flyway_schema_history where script = 'V9__seed_historical_player_catalog.sql';"
psql -U zhulin -d basketball_gm_test \
  -c "delete from flyway_schema_history where script = 'V9__seed_historical_player_catalog.sql';"
```

Then start the backend once with out-of-order migrations allowed (the re-added V9 sorts
below the already applied V10/V11):

```bash
SPRING_FLYWAY_OUT_OF_ORDER=true mvn spring-boot:run   # or: SPRING_FLYWAY_OUT_OF_ORDER=true mvn test
```

Later startups run without the variable and validate normally. Fresh databases apply
every migration in order and need none of these steps.
