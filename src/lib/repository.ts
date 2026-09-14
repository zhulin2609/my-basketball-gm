import { players } from '../data/players'
import type { Lineup, Simulation } from '../types'

const LINEUPS_KEY = 'dream-court.lineups.v1'
const GAMES_KEY = 'dream-court.games.v1'

export const lineupRepository = {
  list(): Lineup[] { return JSON.parse(localStorage.getItem(LINEUPS_KEY) || '[]') },
  save(lineup: Lineup) {
    const all = this.list(); const index = all.findIndex(item => item.id === lineup.id)
    if (index < 0) all.unshift(lineup); else all[index] = lineup
    localStorage.setItem(LINEUPS_KEY, JSON.stringify(all)); return lineup
  },
  remove(id: string) { localStorage.setItem(LINEUPS_KEY, JSON.stringify(this.list().filter(item => item.id !== id))) },
}

export const simulationRepository = {
  list(): Simulation[] { return JSON.parse(localStorage.getItem(GAMES_KEY) || '[]') },
  save(game: Simulation) { localStorage.setItem(GAMES_KEY, JSON.stringify([game, ...this.list()].slice(0, 20))); return game },
}

export function starterLineup(): Lineup {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), name: '我的梦之队', description: '从这里开始搭建你的历史最佳阵容。', createdAt: now, updatedAt: now,
    members: ['curry','jordan','lebron','duncan','shaq'].map((playerId, index) => ({ playerId, position: ['PG','SG','SF','PF','C'][index] as any, starter: true, inactive: false })) }
}

export function classicLineup(): Lineup {
  const now = new Date().toISOString()
  return { id: 'classic-five', name: '经典五人', description: '一套可立即用于对战的示例阵容。', createdAt: now, updatedAt: now,
    members: ['magic','kobe','bird','garnett','olajuwon'].map((playerId, index) => ({ playerId, position: ['PG','SG','SF','PF','C'][index] as any, starter: true, inactive: false })) }
}

export function bootstrapLineups() { if (!lineupRepository.list().length) { lineupRepository.save(classicLineup()); lineupRepository.save(starterLineup()) }; return lineupRepository.list() }
export { players }
