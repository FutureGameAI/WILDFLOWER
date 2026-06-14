import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const LOCAL_KEY = 'wildflower_leaderboard';

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function saveLocal(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 50)));
}

export function submitScore(username, score) {
  const entry = { username, score, ts: Date.now() };
  const list = loadLocal().filter((e) => e.username !== username || e.score !== score);
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  saveLocal(list);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return Promise.resolve(entry);

  return fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ username, score, created_at: new Date().toISOString() }),
  }).catch(() => entry);
}

export async function fetchLeaderboard(limit = 10) {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=username,score,created_at&order=score.desc&limit=${limit}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows.length) {
          return rows.map((r) => ({ username: r.username, score: r.score, ts: Date.parse(r.created_at) }));
        }
      }
    } catch (_) {}
  }
  return loadLocal().slice(0, limit);
}

export function getPersonalBest(username) {
  const list = loadLocal().filter((e) => e.username === username);
  return list.length ? Math.max(...list.map((e) => e.score)) : 0;
}

/** Best score per username, sorted high → low. */
export function mergeBestScores(list) {
  const bests = new Map();
  for (const e of list) {
    const prev = bests.get(e.username);
    if (!prev || e.score > prev.score) bests.set(e.username, { username: e.username, score: e.score });
  }
  return [...bests.values()].sort((a, b) => b.score - a.score);
}

/** 1-based world rank for a score (1 = best). */
export function computeRank(username, score, list) {
  const merged = mergeBestScores(list);
  const prev = merged.find((e) => e.username === username)?.score || 0;
  const mine = Math.max(score, prev);
  let rank = 1;
  for (const e of merged) {
    if (e.username === username) {
      if (e.score > mine) rank++;
    } else if (e.score > mine) {
      rank++;
    }
  }
  if (!merged.some((e) => e.username === username)) {
    rank = 1 + merged.filter((e) => e.score > mine).length;
  }
  return Math.max(1, rank);
}
