const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.get('/', async (req, res) => {
  const session = driver.session();
  const { q } = req.query;
  try {
    let query, params = {};
    if (q) {
      query = `MATCH (p:Person) WHERE toLower(p.name) CONTAINS toLower($q) OR toLower(p.role) CONTAINS toLower($q) OR toLower(p.status) CONTAINS toLower($q) OPTIONAL MATCH (p)-[:INVOLVED_IN|WITNESSED|RESPONDED_TO]->(i:Incident) RETURN p, collect(DISTINCT i.title) AS incidents`;
      params = { q };
    } else {
      query = `MATCH (p:Person) OPTIONAL MATCH (p)-[:INVOLVED_IN|WITNESSED|RESPONDED_TO]->(i:Incident) RETURN p, collect(DISTINCT i.title) AS incidents`;
    }
    const result = await session.run(query, params);
    res.json(result.records.map(r => {
  const p = r.get('p').properties;
  return {
    ...p,
    age: p.age ? (p.age.toNumber ? p.age.toNumber() : p.age) : null,
    incidents: r.get('incidents')
  };
}));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.get('/:id', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`MATCH (p:Person {id:$id}) OPTIONAL MATCH (p)-[r:INVOLVED_IN]->(i:Incident) OPTIONAL MATCH (p)-[:WITNESSED]->(wi:Incident) OPTIONAL MATCH (p)-[:RESPONDED_TO]->(ri:Incident) RETURN p, collect(DISTINCT {incident:i, role:r.role}) AS involved, collect(DISTINCT wi) AS witnessed, collect(DISTINCT ri) AS responded`, { id: req.params.id });
    if (!result.records.length) return res.status(404).json({ error: 'Not found' });
    const r = result.records[0];
    res.json({ ...r.get('p').properties, involved: r.get('involved').filter(e => e.incident).map(e => ({ ...e.incident.properties, role: e.role })), witnessed: r.get('witnessed').map(n => n.properties), responded: r.get('responded').map(n => n.properties) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.post('/', async (req, res) => {
  const session = driver.session();
  const { name, role, age, status } = req.body;
  const id = 'p' + Date.now();
  try {
    await session.run(`CREATE (:Person {id:$id, name:$name, role:$role, age:toInteger($age), status:$status})`, { id, name, role, age, status });
    res.status(201).json({ message: 'Person created', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.put('/:id', async (req, res) => {
  const session = driver.session();
  const { name, role, age, status } = req.body;
  try {
    await session.run(`MATCH (p:Person {id:$id}) SET p.name=$name, p.role=$role, p.age=toInteger($age), p.status=$status`, { id: req.params.id, name, role, age, status });
    res.json({ message: 'Person updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.delete('/:id', async (req, res) => {
  const session = driver.session();
  try {
    await session.run(`MATCH (p:Person {id:$id}) DETACH DELETE p`, { id: req.params.id });
    res.json({ message: 'Person deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;