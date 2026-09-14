# Dream Court / 梦之队

一个面向 PC 浏览器的历史篮球球星资料库、阵容编辑与梦幻对战模拟器。V1 使用浏览器本地存储，且已保留 REST API 与 PostgreSQL 数据模型边界。

## Run

```bash
npm install
npm run dev
```

## Product decisions in V1

- 99 分制；一名球员只保存一个巅峰赛季的自定义评价。
- 阵容为 5–15 人；15 人名单遵循 13 名激活、2 名非激活。首发必须各有一个 PG / SG / SF / PF / C，位置只属于该阵容条目。
- 比赛引擎是可复现的纯 TypeScript 统计模型，输入双方阵容与 seed，输出比分及球员数据。
- 目前数据、阵容保存于 `localStorage`；部署后将 `VITE_API_BASE_URL` 指向后端，逐步替换 `src/lib/repository.ts` 的本地实现即可。

## Backend contract

`src/lib/api.ts` 定义客户端入口与请求形状；`db/schema.sql` 是 PostgreSQL 初始建表。建议后端暴露：

- `GET /players?query=&sort=&order=`
- `GET/POST/PATCH/DELETE /lineups/:id`
- `POST /simulations`

## Disclaimer

This independent fan prototype is not affiliated with or endorsed by any basketball league, players association, team, or rights holder. It deliberately contains no logos, player imagery, uniforms, or copied rating database. Ratings are original illustrative data.
