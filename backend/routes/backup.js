const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.get('/', async (req, res) => {
  try {
    const runQuery = (cypher) => {
      const s = driver.session();
      return s.run(cypher).finally(() => s.close());
    };

    const [incidents, persons, locations, agencies] = await Promise.all([
      runQuery(`MATCH (i:Incident) OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location) OPTIONAL MATCH (i)-[:RESPONDED_BY]->(a:Agency) OPTIONAL MATCH (p:Person)-[r:INVOLVED_IN]->(i) RETURN i, collect(DISTINCT l.name) AS locations, collect(DISTINCT a.name) AS agencies, collect(DISTINCT {name:p.name, role:r.role}) AS persons`),
      runQuery(`MATCH (p:Person) RETURN p`),
      runQuery(`MATCH (l:Location) OPTIONAL MATCH (i:Incident)-[:OCCURRED_AT]->(l) RETURN l, count(i) AS incidentCount`),
      runQuery(`MATCH (a:Agency) RETURN a`)
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        incidents: incidents.records.map(r => ({ ...r.get('i').properties, locations: r.get('locations'), agencies: r.get('agencies'), persons: r.get('persons') })),
        persons: persons.records.map(r => r.get('p').properties),
        locations: locations.records.map(r => ({ ...r.get('l').properties, incidentCount: r.get('incidentCount').toNumber() })),
        agencies: agencies.records.map(r => r.get('a').properties)
      }
    };

    res.setHeader('Content-Disposition', `attachment; filename="safenet-backup-${new Date().toISOString().slice(0,10)}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;