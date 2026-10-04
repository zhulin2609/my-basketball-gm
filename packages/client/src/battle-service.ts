import { simulate } from '@dream-court/core';
import type { Lineup, Player, Simulation, SimulationMode } from '@dream-court/core';
import type { ApiClient } from './api';
import type { Clock, IdGenerator, RandomSeed } from './ports';
import type { GuestRepositories } from './repository';

export interface BattleServiceDeps {
  api: ApiClient;
  repositories: GuestRepositories;
  id: IdGenerator;
  clock: Clock;
  randomSeed: RandomSeed;
}

export interface BattleService {
  /**
   * 游客模式：使用共享 TypeScript 引擎在设备上计算，并把战报写入本地工作区。
   * seed、战报 ID 与创建时间由注入的平台能力生成，引擎自身保持确定性。
   */
  runLocal(home: Lineup, away: Lineup, players: Player[]): Simulation;
  /**
   * 登录模式：先等待两套阵容的在途保存完成，再由 Java 规则引擎计算并由服务端保存。
   * 请求失败时抛出真实错误，不生成本地战报。
   */
  runCloud(
    homeLineupId: string,
    awayLineupId: string,
    simulationMode: SimulationMode,
    pendingSaves: Array<Promise<void>>,
  ): Promise<Simulation>;
}

export function createBattleService(deps: BattleServiceDeps): BattleService {
  return {
    runLocal(home, away, players) {
      const report = simulate(home, away, players, {
        seed: deps.randomSeed(),
        id: deps.id(),
        now: deps.clock(),
      });
      deps.repositories.simulations.save(report);
      return report;
    },
    async runCloud(homeLineupId, awayLineupId, simulationMode, pendingSaves) {
      await Promise.all(pendingSaves);
      return deps.api.simulate(homeLineupId, awayLineupId, simulationMode);
    },
  };
}
