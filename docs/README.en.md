# Dream Court

[中文版 README](../README.md)

A historical basketball star database, lineup editor, and fantasy matchup simulator for PC browsers, with community sharing. The frontend is React + TypeScript + Vite, the backend is Java 21 + Spring Boot + MyBatis, and data is persisted in PostgreSQL.

## Gameplay

- **Player library**: 416 players (19 curated stars plus 397 historical players covering the NBA Top 75, All-Stars, All-NBA and All-Defensive teams, and every Finals MVP from 1978–2026). Paginated browsing with search, position filters, and rating sort. Ratings use a 99-point scale; each player keeps a single peak-season evaluation.
- **Custom players**: create your own players or override a public player's ratings; custom data belongs to your account.
- **My lineups**: each lineup holds 5–15 players with at most 13 active; the starting five must include exactly one PG / SG / SF / PF / C.
- **Fantasy matchups**: everyone can play with the built-in local rules engine; signed-in users can additionally choose AI simulation (configure an OpenAI-compatible API key in AI settings — keys are encrypted server-side). Every box score names a Player of the Game automatically. Reports expire 30 days after creation and are physically purged daily at 03:00 Beijing time.
- **Guest mode**: browse the library, create players and lineups, and run local matchups without an account; data lives in browser localStorage. Registering imports guest data automatically; signing into an existing account lets you choose whether to import.
- **Community**: signed-in users can publish eligible lineups (published as a frozen snapshot); others browse, comment (one-level replies), and copy a lineup into their own collection with one click. Lineups containing custom players or overridden public players cannot be published. Writes pass a local sensitive-word filter and optional Tencent Cloud CMS moderation, with server-side rate limits, link restrictions for new accounts, and an admin deletion channel.
- The UI is available in Simplified Chinese and English.

## Architecture

The system has three parts; see `docs/ARCHITECTURE.md` (in Chinese) for details:

- Frontend: React, TypeScript, Vite. Entry points are `src/main.tsx` and `src/App.tsx`; the dev server runs on `127.0.0.1:5173`.
- Backend: Java 21, Spring Boot, MyBatis. Entry point is `backend/src/main/java/com/links/basketballgm/BasketballGmApplication.java`; it runs on `127.0.0.1:8080` and is organized by business module (auth, player, lineup, simulation, llm, guest, forum, moderation, user, config).
- Database: PostgreSQL 16. The schema is maintained by Flyway migrations in `backend/src/main/resources/db/migration/`.

Authentication uses JWT, with the token stored in localStorage. In local development, Vite proxies `/api` requests to the backend.

## Local development

Prerequisites: Node.js with npm, JDK 21, Maven, and PostgreSQL 16 with a `basketball_gm_dev` database created (Flyway creates the tables on first launch).

Start the backend:

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn spring-boot:run
```

You can also run `mvn package` first and then `java -jar target/basketball-gm-api-0.0.1-SNAPSHOT.jar`. The health check is `http://127.0.0.1:8080/api/v1/health`.

Start the frontend:

```bash
npm install
npm run dev
```

The frontend is at `http://127.0.0.1:5173/`. The root `.env.local` sets `VITE_API_BASE_URL=/api/v1` (see `.env.example`); Vite proxies `/api` to `127.0.0.1:8080` accordingly.

Common backend environment variables (all have defaults and are optional for local development):

- `JWT_SECRET`: JWT signing key; must be set in production.
- `FORUM_ADMIN_USERNAMES`: comma-separated community admin usernames; admins can delete any post or comment.
- `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY`: enables Tencent Cloud CMS text moderation when set; the local word filter stays active either way.
- `MODERATION_WORD_LIST`: word list location, defaults to `classpath:moderation-words.txt`; a `file:` prefix points to an external file.
- `FORUM_COMMENT_PER_SECOND` / `FORUM_COMMENT_PER_DAY` / `FORUM_PUBLISH_PER_HOUR` / `FORUM_NEW_ACCOUNT_LINK_HOURS`: community rate limits and the new-account link restriction.

## Tests

```bash
npm test                # Frontend unit, component, and data tests (Vitest)
npm run build           # TypeScript type check and production build
npm run format:check    # Prettier format check
cd backend && mvn test  # All backend tests (including real PostgreSQL integration tests)
```

The backend integration tests use a `basketball_gm_test` database; create it beforehand.

## Project documentation

The following documents are written in Chinese:

- `docs/ARCHITECTURE.md`: system boundaries, frontend/backend module layout, database relations, test boundaries.
- `docs/AI_HANDOFF.md`: current development status, completed work, local run requirements, and test status.
- `docs/plans/current.md`: the current task's plan, decisions, and acceptance criteria.
- `docs/DECISIONS.md`: historical design decisions.

## Disclaimer

This independent fan prototype is not affiliated with or endorsed by any basketball league, players association, team, or rights holder. It deliberately contains no logos, player imagery, uniforms, or copied rating database. Ratings are original illustrative data.
