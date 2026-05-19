const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.get('/', async (req, res) => {
  const session = driver.session();
  const { q } = req.query;
  try {
    let query, params = {};
    if (q) {
      query = `MATCH (l:Location) WHERE toLower(l.name) CONTAINS toLower($q) OR toLower(l.type) CONTAINS toLower($q) OPTIONAL MATCH (i:Incident)-[:OCCURRED_AT]->(l) RETURN l, count(i) AS incidentCount`;
      params = { q };
    } else {
      query = `MATCH (l:Location) OPTIONAL MATCH (i:Incident)-[:OCCURRED_AT]->(l) RETURN l, count(i) AS incidentCount`;
    }
    const result = await session.run(query, params);
    res.json(result.records.map(r => ({ ...r.get('l').properties, incidentCount: r.get('incidentCount').toNumber() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.post('/', async (req, res) => {
  const session = driver.session();
  const { name, type, lat, lng } = req.body;
  const id = 'loc' + Date.now();
  try {
    await session.run(`CREATE (:Location {id:$id, name:$name, type:$type, lat:toFloat($lat), lng:toFloat($lng)})`, { id, name, type, lat, lng });
    res.status(201).json({ message: 'Location created', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.put('/:id', async (req, res) => {
  const session = driver.session();
  const { name, type, lat, lng } = req.body;
  try {
    await session.run(`MATCH (l:Location {id:$id}) SET l.name=$name, l.type=$type, l.lat=toFloat($lat), l.lng=toFloat($lng)`, { id: req.params.id, name, type, lat, lng });
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.delete('/:id', async (req, res) => {
  const session = driver.session();
  try {
    await session.run(`MATCH (l:Location {id:$id}) DETACH DELETE l`, { id: req.params.id });
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;