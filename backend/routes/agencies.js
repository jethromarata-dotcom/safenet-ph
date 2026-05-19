const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.get('/', async (req, res) => {
  const session = driver.session();
  const { q } = req.query;
  try {
    let query, params = {};
    if (q) {
      query = `MATCH (a:Agency) WHERE toLower(a.name) CONTAINS toLower($q) OR toLower(a.code) CONTAINS toLower($q) OR toLower(a.type) CONTAINS toLower($q) OPTIONAL MATCH (i:Incident)-[:RESPONDED_BY]->(a) RETURN a, count(i) AS incidentCount`;
      params = { q };
    } else {
      query = `MATCH (a:Agency) OPTIONAL MATCH (i:Incident)-[:RESPONDED_BY]->(a) RETURN a, count(i) AS incidentCount`;
    }
    const result = await session.run(query, params);
    res.json(result.records.map(r => ({ ...r.get('a').properties, incidentCount: r.get('incidentCount').toNumber() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.get('/:id', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`MATCH (a:Agency {id:$id}) OPTIONAL MATCH (i:Incident)-[:RESPONDED_BY]->(a) RETURN a, collect(DISTINCT i) AS incidents`, { id: req.params.id });
    if (!result.records.length) return res.status(404).json({ error: 'Not found' });
    const r = result.records[0];
    res.json({ ...r.get('a').properties, incidents: r.get('incidents').map(n => n.properties) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.post('/', async (req, res) => {
  const session = driver.session();
  const { name, code, type } = req.body;
  const id = 'ag' + Date.now();
  try {
    await session.run(`CREATE (:Agency {id:$id, name:$name, code:$code, type:$type})`, { id, name, code, type });
    res.status(201).json({ message: 'Agency created', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.put('/:id', async (req, res) => {
  const session = driver.session();
  const { name, code, type } = req.body;
  try {
    await session.run(`MATCH (a:Agency {id:$id}) SET a.name=$name, a.code=$code, a.type=$type`, { id: req.params.id, name, code, type });
    res.json({ message: 'Agency updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.delete('/:id', async (req, res) => {
  const session = driver.session();
  try {
    await session.run(`MATCH (a:Agency {id:$id}) DETACH DELETE a`, { id: req.params.id });
    res.json({ message: 'Agency deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;