const express = require('express');
const router = express.Router();
const driver = require('../neo4j');

router.post('/', async (req, res) => {
  const session = driver.session();
  const { personId, incidentId, relType, roleLabel } = req.body;
  try {
    if (relType === 'INVOLVED_IN') {
      await session.run(`MATCH (p:Person {id:$personId}), (i:Incident {id:$incidentId}) MERGE (p)-[:INVOLVED_IN {role:$roleLabel}]->(i)`, { personId, incidentId, roleLabel });
    } else if (relType === 'WITNESSED') {
      await session.run(`MATCH (p:Person {id:$personId}), (i:Incident {id:$incidentId}) MERGE (p)-[:WITNESSED]->(i)`, { personId, incidentId });
    } else if (relType === 'RESPONDED_TO') {
      await session.run(`MATCH (p:Person {id:$personId}), (i:Incident {id:$incidentId}) MERGE (p)-[:RESPONDED_TO]->(i)`, { personId, incidentId });
    }
    res.status(201).json({ message: 'Link created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.delete('/', async (req, res) => {
  const session = driver.session();
  const { personId, incidentId, relType } = req.body;
  try {
    if (relType === 'INVOLVED_IN') {
      await session.run(`MATCH (p:Person {id:$personId})-[r:INVOLVED_IN]->(i:Incident {id:$incidentId}) DELETE r`, { personId, incidentId });
    } else if (relType === 'WITNESSED') {
      await session.run(`MATCH (p:Person {id:$personId})-[r:WITNESSED]->(i:Incident {id:$incidentId}) DELETE r`, { personId, incidentId });
    } else if (relType === 'RESPONDED_TO') {
      await session.run(`MATCH (p:Person {id:$personId})-[r:RESPONDED_TO]->(i:Incident {id:$incidentId}) DELETE r`, { personId, incidentId });
    }
    res.json({ message: 'Link removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
