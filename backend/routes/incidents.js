const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.get('/', async (req, res) => {
  const session = driver.session();
  const { q } = req.query;
  try {
    let query, params = {};
    if (q) {
      query = `MATCH (i:Incident) WHERE toLower(i.title) CONTAINS toLower($q) OR toLower(i.type) CONTAINS toLower($q) OR toLower(i.status) CONTAINS toLower($q) OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location) OPTIONAL MATCH (i)-[:RESPONDED_BY]->(a:Agency) RETURN i, collect(DISTINCT l.name) AS locations, collect(DISTINCT a.name) AS agencies ORDER BY i.date DESC`;
      params = { q };
    } else {
      query = `MATCH (i:Incident) OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location) OPTIONAL MATCH (i)-[:RESPONDED_BY]->(a:Agency) RETURN i, collect(DISTINCT l.name) AS locations, collect(DISTINCT a.name) AS agencies ORDER BY i.date DESC`;
    }
    const result = await session.run(query, params);
    res.json(result.records.map(r => ({ ...r.get('i').properties, locations: r.get('locations'), agencies: r.get('agencies') })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.get('/:id', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (i:Incident {id:$id})
      OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location)
      OPTIONAL MATCH (i)-[:RESPONDED_BY]->(a:Agency)
      OPTIONAL MATCH (p:Person)-[r:INVOLVED_IN]->(i)
      OPTIONAL MATCH (w:Person)-[:WITNESSED]->(i)
      RETURN i,
        collect(DISTINCT l) AS locations,
        collect(DISTINCT a) AS agencies,
        collect(DISTINCT {person:p, role:r.role}) AS involved,
        collect(DISTINCT w) AS witnesses,
        head(collect(DISTINCT l.id)) AS locationId,
        head(collect(DISTINCT a.id)) AS agencyId
    `, { id: req.params.id });
    if (!result.records.length) return res.status(404).json({ error: 'Not found' });
    const r = result.records[0];
    res.json({
      ...r.get('i').properties,
      locations: r.get('locations').map(n => n.properties),
      agencies: r.get('agencies').map(n => n.properties),
      involved: r.get('involved').filter(e => e.person).map(e => ({ ...e.person.properties, role: e.role })),
      witnesses: r.get('witnesses').map(n => n.properties),
      locationId: r.get('locationId'),
      agencyId: r.get('agencyId')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.post('/', async (req, res) => {
  const session = driver.session();
  const { title, type, severity, date, status, locationId, agencyId } = req.body;
  const id = 'inc' + Date.now();
  try {
    await session.run(`CREATE (i:Incident {id:$id, title:$title, type:$type, severity:$severity, date:$date, status:$status})`, { id, title, type, severity, date, status });
    if (locationId) await session.run(`MATCH (i:Incident {id:$id}), (l:Location {id:$locationId}) MERGE (i)-[:OCCURRED_AT]->(l)`, { id, locationId });
    if (agencyId) await session.run(`MATCH (i:Incident {id:$id}), (a:Agency {id:$agencyId}) MERGE (i)-[:RESPONDED_BY]->(a)`, { id, agencyId });
    res.status(201).json({ message: 'Incident created', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.put('/:id', async (req, res) => {
  const session = driver.session();
  const { title, type, severity, date, status, locationId, agencyId } = req.body;
  try {
    // Update properties
    await session.run(`MATCH (i:Incident {id:$id}) SET i.title=$title, i.type=$type, i.severity=$severity, i.date=$date, i.status=$status`, { id: req.params.id, title, type, severity, date, status });

    // Remove old location/agency relationships then re-add
    await session.run(`MATCH (i:Incident {id:$id})-[r:OCCURRED_AT]->() DELETE r`, { id: req.params.id });
    await session.run(`MATCH (i:Incident {id:$id})-[r:RESPONDED_BY]->() DELETE r`, { id: req.params.id });

    if (locationId) await session.run(`MATCH (i:Incident {id:$id}), (l:Location {id:$locationId}) MERGE (i)-[:OCCURRED_AT]->(l)`, { id: req.params.id, locationId });
    if (agencyId) await session.run(`MATCH (i:Incident {id:$id}), (a:Agency {id:$agencyId}) MERGE (i)-[:RESPONDED_BY]->(a)`, { id: req.params.id, agencyId });

    res.json({ message: 'Incident updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.delete('/:id', async (req, res) => {
  const session = driver.session();
  try {
    await session.run(`MATCH (i:Incident {id:$id}) DETACH DELETE i`, { id: req.params.id });
    res.json({ message: 'Incident deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;