/** Production adapter boundary. Current UI uses repository.ts (localStorage) for the offline MVP. */
import type { Lineup, Player, Simulation } from '../types'
const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured')
  const response = await fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...init?.headers }, ...init })
  if (!response.ok) throw new Error(`API ${response.status}`); return response.json() as Promise<T>
}
export const api = {
  listPlayers: () => request<Player[]>('/players'),
  listLineups: () => request<Lineup[]>('/lineups'),
  saveLineup: (lineup: Lineup) => request<Lineup>(`/lineups/${lineup.id}`, { method: 'PUT', body: JSON.stringify(lineup) }),
  simulate: (homeLineupId: string, awayLineupId: string, seed?: number) => request<Simulation>('/simulations', { method: 'POST', body: JSON.stringify({ homeLineupId, awayLineupId, seed }) }),
}
