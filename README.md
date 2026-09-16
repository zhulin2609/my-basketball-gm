# Dream Court / 梦之队

一个面向 PC 浏览器的历史篮球球星资料库、阵容编辑与梦幻对战模拟器。配置 API 后，球员、阵容和近 30 天战报由 PostgreSQL 持久化；未配置 API 时仍可作为离线演示使用。

## Run

```bash
npm install
npm run dev
```

## Product decisions in V1

- 99 分制；一名球员只保存一个巅峰赛季的自定义评价。
- 阵容为 5–15 人；15 人名单遵循 13 名激活、2 名非激活。首发必须各有一个 PG / SG / SF / PF / C，位置只属于该阵容条目。
- 云端比赛由 Java 服务使用可复现的 V1 统计模型计算，输入双方阵容与 seed，原子保存比分及球员数据。
- 云端战报在创建 30 天后停止展示，每天北京时间 03:00 物理清理；离线演示记录也按 30 天过滤。

## Backend contract

`src/lib/api.ts` 定义客户端入口与请求形状；`db/schema.sql` 是 PostgreSQL 初始建表。建议后端暴露：

- `GET /players?query=&sort=&order=`
- `GET/POST/PATCH/DELETE /lineups/:id`
- `GET /simulations?limit=30`
- `POST /simulations`

## Disclaimer

This independent fan prototype is not affiliated with or endorsed by any basketball league, players association, team, or rights holder. It deliberately contains no logos, player imagery, uniforms, or copied rating database. Ratings are original illustrative data.
