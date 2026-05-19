const express = require('express');
const cors = require('cors');
const { getDb, initSchema } = require('./db');

const PORT = process.env.PORT || 3001;

initSchema();
const db = getDb();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/items', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, name, species, description, image_url AS imageUrl
         FROM items
         ORDER BY id ASC`
      )
      .all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load items' });
  }
});

app.delete('/api/vote', (req, res) => {
  const { itemId, sessionId } = req.body || {};

  if (!itemId || typeof itemId !== 'string') {
    return res.status(400).json({ error: 'itemId is required' });
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const result = db
      .prepare('DELETE FROM votes WHERE item_id = ? AND session_id = ?')
      .run(itemId, sessionId.trim());

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

app.post('/api/vote', (req, res) => {
  const { itemId, choice, sessionId } = req.body || {};

  if (!itemId || typeof itemId !== 'string') {
    return res.status(400).json({ error: 'itemId is required' });
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (choice !== 'yes' && choice !== 'no') {
    return res.status(400).json({ error: 'choice must be "yes" or "no"' });
  }

  const item = db.prepare('SELECT id FROM items WHERE id = ?').get(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  try {
    const result = db
      .prepare(
        `INSERT INTO votes (item_id, session_id, choice, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(item_id, session_id) DO UPDATE SET
           choice = excluded.choice,
           updated_at = datetime('now')
         RETURNING id, item_id AS itemId, session_id AS sessionId, choice,
           created_at AS createdAt, updated_at AS updatedAt`
      )
      .get(itemId, sessionId.trim(), choice);

    res.json({ ok: true, vote: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

app.get('/api/session/:sessionId/votes', (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const votes = db
      .prepare(
        `SELECT item_id AS itemId, choice
         FROM votes
         WHERE session_id = ?`
      )
      .all(sessionId.trim());
    res.json(votes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load session votes' });
  }
});

app.get('/api/results', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT
           i.id,
           i.name,
           i.species,
           i.description,
           i.image_url AS imageUrl,
           COALESCE(SUM(CASE WHEN v.choice = 'yes' THEN 1 ELSE 0 END), 0) AS yesCount,
           COALESCE(SUM(CASE WHEN v.choice = 'no' THEN 1 ELSE 0 END), 0) AS noCount,
           COUNT(v.id) AS totalVotes
         FROM items i
         LEFT JOIN votes v ON v.item_id = i.id
         GROUP BY i.id
         ORDER BY i.id ASC`
      )
      .all()
      .map((row) => {
        const total = row.totalVotes;
        const yesPercent = total > 0 ? Math.round((row.yesCount / total) * 1000) / 10 : 0;
        const divisiveness =
          total > 0
            ? Math.round((Math.min(row.yesCount, row.noCount) / total) * 1000) / 10
            : 0;
        return { ...row, yesPercent, divisiveness };
      });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load results' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`PawSwipe API listening on http://localhost:${PORT}`);
});
