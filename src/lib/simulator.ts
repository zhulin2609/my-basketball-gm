import type { Lineup, Player, PlayerStat, Simulation } from '../types'

const seeded = (seed: number) => { let n = seed >>> 0; return () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296) }
const active = (lineup: Lineup) => lineup.members.filter(item => !item.inactive)

function makeStats(lineup: Lineup, playerMap: Map<string, Player>, rand: () => number): PlayerStat[] {
  const members = active(lineup); const totalUsage = members.reduce((sum, m) => sum + (playerMap.get(m.playerId)?.shotTendency ?? 70), 0)
  return members.map((member, index) => {
    const p = playerMap.get(member.playerId)!; const minutes = Math.max(10, Math.round((member.starter ? 32 : 18) + (rand() - .5) * 8))
    const share = p.shotTendency / totalUsage; const attempts = Math.max(3, Math.round(83 * share * (minutes / 25) + rand() * 4))
    const threeAttempted = Math.min(attempts, Math.round(attempts * (.13 + p.threePoint / 180) * (0.8 + rand() * .4)))
    const threeMade = Math.min(threeAttempted, Math.round(threeAttempted * (.24 + p.threePoint / 210) * (.88 + rand() * .24)))
    const twoAttempted = attempts - threeAttempted; const twoMade = Math.min(twoAttempted, Math.round(twoAttempted * (.31 + p.twoPoint / 260) * (.9 + rand() * .2)))
    const freeThrows = Math.round((p.shotTendency / 26 + rand() * 3) * (p.freeThrow / 100))
    return { playerId: p.id, minutes, points: twoMade * 2 + threeMade * 3 + freeThrows, rebounds: Math.max(0, Math.round((p.rebounding / 12) * (minutes / 30) * (.55 + rand()))), assists: Math.max(0, Math.round((p.passing / 18) * (minutes / 30) * (.5 + rand()))), steals: Math.max(0, Math.round((p.steal / 62) * (minutes / 30) * (.4 + rand()))), blocks: Math.max(0, Math.round((p.block / 56) * (minutes / 30) * (.3 + rand()))), fgMade: twoMade + threeMade, fgAttempted: attempts, threeMade, threeAttempted }
  }).sort((a, b) => b.points - a.points)
}

export function simulate(home: Lineup, away: Lineup, source: Player[], seed = Math.floor(Math.random() * 2 ** 31)): Simulation {
  const map = new Map(source.map(p => [p.id, p])); const rand = seeded(seed); const homeStats = makeStats(home, map, rand); const awayStats = makeStats(away, map, rand)
  let homeScore = homeStats.reduce((sum, stat) => sum + stat.points, 0); let awayScore = awayStats.reduce((sum, stat) => sum + stat.points, 0)
  if (homeScore === awayScore) { if (rand() > .5) homeScore += 3; else awayScore += 3 }
  return { id: crypto.randomUUID(), homeLineupId: home.id, awayLineupId: away.id, seed, homeScore, awayScore, homeStats, awayStats, createdAt: new Date().toISOString() }
}
