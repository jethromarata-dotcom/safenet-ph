const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.get('/', async (req, res) => {
  try {
    const runQuery = (cypher, params = {}) => {
      const s = driver.session();
      return s.run(cypher, params).finally(() => s.close());
    };

    const [counts, bySeverity, byType, byStatus, hotspots, recentIncidents] = await Promise.all([
      runQuery(`MATCH (i:Incident) WITH count(i) AS incidents MATCH (p:Person) WITH incidents, count(p) AS persons MATCH (l:Location) WITH incidents, persons, count(l) AS locations MATCH (a:Agency) WITH incidents, persons, locations, count(a) AS agencies RETURN incidents, persons, locations, agencies`),
      runQuery(`MATCH (i:Incident) RETURN i.severity AS severity, count(i) AS count ORDER BY count DESC`),
      runQuery(`MATCH (i:Incident) RETURN i.type AS type, count(i) AS count ORDER BY count DESC`),
      runQuery(`MATCH (i:Incident) RETURN i.status AS status, count(i) AS count ORDER BY count DESC`),
      runQuery(`MATCH (i:Incident)-[:OCCURRED_AT]->(l:Location) RETURN l.name AS location, count(i) AS count ORDER BY count DESC LIMIT 5`),
      runQuery(`MATCH (i:Incident) OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location) RETURN i, l.name AS location ORDER BY i.date DESC LIMIT 5`)
    ]);

    const c = counts.records[0];
    res.json({
      totals: {
        incidents: c.get('incidents').toNumber(),
        persons: c.get('persons').toNumber(),
        locations: c.get('locations').toNumber(),
        agencies: c.get('agencies').toNumber()
      },
      bySeverity: bySeverity.records.map(r => ({ label: r.get('severity'), count: r.get('count').toNumber() })),
      byType: byType.records.map(r => ({ label: r.get('type'), count: r.get('count').toNumber() })),
      byStatus: byStatus.records.map(r => ({ label: r.get('status'), count: r.get('count').toNumber() })),
      hotspots: hotspots.records.map(r => ({ location: r.get('location'), count: r.get('count').toNumber() })),
      recentIncidents: recentIncidents.records.map(r => ({ ...r.get('i').properties, location: r.get('location') }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;