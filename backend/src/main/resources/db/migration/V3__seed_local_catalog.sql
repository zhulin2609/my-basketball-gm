insert into players (
  id, catalog_key, is_custom, name, initials, peak_season, peak_team, default_position,
  height_feet, height_inches, weight_lbs, salary_usd, archetype, bio, accent,
  three_point, layup, mid_range, inside_scoring, dunk, offensive_rebound, defensive_rebound,
  handling, passing, defensive_iq, offensive_iq, speed, agility, vertical, strength,
  free_throw, steal, block, stamina, shot_tendency
)
values
  ('11111111-1111-1111-1111-111111111111', 'curry', false, 'Stephen Curry', 'SC', '2015–16', 'Golden State', 'PG', 6, 2, 185, 12112000, 'Deep-range creator', 'Elite off-ball movement and deep shooting.', '#c3ec8b', 99, 95, 92, 65, 45, 45, 52, 98, 94, 78, 97, 92, 94, 72, 60, 91, 86, 42, 96, 92),
  ('22222222-2222-2222-2222-222222222222', 'jordan', false, 'Michael Jordan', 'MJ', '1990–91', 'Chicago', 'SG', 6, 6, 216, 2500000, 'Two-way scorer', 'Relentless perimeter creator with elite big-game shot making.', '#f6a623', 82, 99, 94, 88, 98, 72, 84, 96, 87, 96, 96, 96, 94, 98, 78, 85, 97, 78, 96, 92),
  ('33333333-3333-3333-3333-333333333333', 'lebron', false, 'LeBron James', 'LJ', '2012–13', 'Miami', 'SF', 6, 9, 250, 17545000, 'Power playmaker', 'Versatile downhill creator who can control every possession.', '#f3c969', 79, 97, 86, 94, 96, 78, 82, 98, 98, 92, 98, 95, 91, 94, 88, 76, 82, 76, 96, 94),
  ('44444444-4444-4444-4444-444444444444', 'duncan', false, 'Tim Duncan', 'TD', '2002–03', 'San Antonio', 'PF', 6, 11, 250, 12640000, 'Fundamental anchor', 'Calm interior scorer and disciplined rim protector.', '#8fb7e6', 45, 91, 85, 96, 80, 96, 98, 72, 82, 98, 95, 70, 68, 74, 95, 69, 74, 97, 94, 82),
  ('55555555-5555-5555-5555-555555555555', 'shaq', false, 'Shaquille O’Neal', 'SO', '1999–00', 'Los Angeles', 'C', 7, 1, 325, 17142000, 'Paint force', 'Overwhelming interior finisher and rebounding presence.', '#e4a7d0', 25, 98, 62, 99, 99, 97, 97, 58, 72, 88, 94, 75, 67, 86, 99, 55, 46, 99, 92, 94)
on conflict (catalog_key) do nothing;
