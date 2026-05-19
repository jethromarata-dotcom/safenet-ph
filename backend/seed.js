const driver = require('./neo4j');
require('dotenv').config();

async function seed() {
  const session = driver.session();
  try {
    console.log('Clearing old data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Seeding Locations...');
    await session.run(`
      CREATE (:Location {id: 'loc1', name: 'Poblacion, Iligan City', type: 'Barangay', lat: 8.2280, lng: 124.2452})
      CREATE (:Location {id: 'loc2', name: 'Tibanga, Iligan City', type: 'District', lat: 8.2350, lng: 124.2600})
      CREATE (:Location {id: 'loc3', name: 'Robinsons Place Iligan', type: 'Landmark', lat: 8.2290, lng: 124.2440})
      CREATE (:Location {id: 'loc4', name: 'Pala-o, Iligan City', type: 'Barangay', lat: 8.2450, lng: 124.2650})
      CREATE (:Location {id: 'loc5', name: 'Hinaplanon, Iligan City', type: 'District', lat: 8.2180, lng: 124.2380})
    `);

    console.log('Seeding Agencies...');
    await session.run(`
      CREATE (:Agency {id: 'ag1', name: 'Iligan City Police Office', code: 'ICPO', type: 'Police'})
      CREATE (:Agency {id: 'ag2', name: 'Bureau of Fire Protection Iligan', code: 'BFP-Iligan', type: 'Fire'})
      CREATE (:Agency {id: 'ag3', name: 'Iligan City DRRMO', code: 'DRRMO-Iligan', type: 'Disaster Response'})
      CREATE (:Agency {id: 'ag4', name: 'Amai Pakpak Medical Center', code: 'APMC', type: 'Medical'})
    `);

    console.log('Seeding Persons...');
    await session.run(`
      CREATE (:Person {id: 'p1', name: 'Ramon Dela Cruz', role: 'Suspect', age: 34, status: 'At Large'})
      CREATE (:Person {id: 'p2', name: 'Maria Dimaporo', role: 'Victim', age: 27, status: 'Safe'})
      CREATE (:Person {id: 'p3', name: 'PO1 Carlo Reyes', role: 'Officer', age: 31, status: 'Active'})
      CREATE (:Person {id: 'p4', name: 'Lito Manalo', role: 'Witness', age: 45, status: 'Interviewed'})
      CREATE (:Person {id: 'p5', name: 'Ana Bautista', role: 'Victim', age: 22, status: 'Hospitalized'})
      CREATE (:Person {id: 'p6', name: 'SPO2 Rodel Flores', role: 'Officer', age: 40, status: 'Active'})
      CREATE (:Person {id: 'p7', name: 'Rommel Tan', role: 'Suspect', age: 29, status: 'Arrested'})
      CREATE (:Person {id: 'p8', name: 'Celine Macapaar', role: 'Witness', age: 19, status: 'Interviewed'})
    `);

    console.log('Seeding Incidents...');
    await session.run(`
      CREATE (:Incident {id: 'inc1', title: 'Armed Robbery at Convenience Store', type: 'Robbery', severity: 'High', date: '2025-11-03', status: 'Open'})
      CREATE (:Incident {id: 'inc2', title: 'Vehicle Theft - Tibanga Area', type: 'Theft', severity: 'Medium', date: '2025-11-05', status: 'Under Investigation'})
      CREATE (:Incident {id: 'inc3', title: 'Residential Structure Fire', type: 'Fire', severity: 'Critical', date: '2025-11-07', status: 'Resolved'})
      CREATE (:Incident {id: 'inc4', title: 'Physical Assault near Robinsons Iligan', type: 'Assault', severity: 'High', date: '2025-11-10', status: 'Open'})
      CREATE (:Incident {id: 'inc5', title: 'Drug Paraphernalia Possession - Pala-o', type: 'Drug Offense', severity: 'Medium', date: '2025-11-12', status: 'Under Investigation'})
      CREATE (:Incident {id: 'inc6', title: 'Flooding - Hinaplanon Low-lying Area', type: 'Natural Disaster', severity: 'High', date: '2025-11-15', status: 'Resolved'})
    `);

    console.log('Seeding Relationships...');
    await session.run(`
      MATCH (p:Person {id:'p1'}), (i:Incident {id:'inc1'}) CREATE (p)-[:INVOLVED_IN {role:'Suspect'}]->(i)
      MATCH (p:Person {id:'p2'}), (i:Incident {id:'inc1'}) CREATE (p)-[:INVOLVED_IN {role:'Victim'}]->(i)
      MATCH (p:Person {id:'p3'}), (i:Incident {id:'inc1'}) CREATE (p)-[:RESPONDED_TO]->(i)
      MATCH (p:Person {id:'p4'}), (i:Incident {id:'inc1'}) CREATE (p)-[:WITNESSED]->(i)
      MATCH (p:Person {id:'p7'}), (i:Incident {id:'inc2'}) CREATE (p)-[:INVOLVED_IN {role:'Suspect'}]->(i)
      MATCH (p:Person {id:'p6'}), (i:Incident {id:'inc2'}) CREATE (p)-[:RESPONDED_TO]->(i)
      MATCH (p:Person {id:'p5'}), (i:Incident {id:'inc4'}) CREATE (p)-[:INVOLVED_IN {role:'Victim'}]->(i)
      MATCH (p:Person {id:'p8'}), (i:Incident {id:'inc4'}) CREATE (p)-[:WITNESSED]->(i)
      MATCH (p:Person {id:'p3'}), (i:Incident {id:'inc4'}) CREATE (p)-[:RESPONDED_TO]->(i)
    `);

    await session.run(`
      MATCH (i:Incident {id:'inc1'}), (l:Location {id:'loc3'}) CREATE (i)-[:OCCURRED_AT]->(l)
      MATCH (i:Incident {id:'inc2'}), (l:Location {id:'loc2'}) CREATE (i)-[:OCCURRED_AT]->(l)
      MATCH (i:Incident {id:'inc3'}), (l:Location {id:'loc1'}) CREATE (i)-[:OCCURRED_AT]->(l)
      MATCH (i:Incident {id:'inc4'}), (l:Location {id:'loc3'}) CREATE (i)-[:OCCURRED_AT]->(l)
      MATCH (i:Incident {id:'inc5'}), (l:Location {id:'loc4'}) CREATE (i)-[:OCCURRED_AT]->(l)
      MATCH (i:Incident {id:'inc6'}), (l:Location {id:'loc5'}) CREATE (i)-[:OCCURRED_AT]->(l)
    `);

    await session.run(`
      MATCH (i:Incident {id:'inc1'}), (a:Agency {id:'ag1'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc2'}), (a:Agency {id:'ag1'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc3'}), (a:Agency {id:'ag2'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc3'}), (a:Agency {id:'ag4'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc4'}), (a:Agency {id:'ag1'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc4'}), (a:Agency {id:'ag4'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc5'}), (a:Agency {id:'ag1'}) CREATE (i)-[:RESPONDED_BY]->(a)
      MATCH (i:Incident {id:'inc6'}), (a:Agency {id:'ag3'}) CREATE (i)-[:RESPONDED_BY]->(a)
    `);

    await session.run(`
      MATCH (i1:Incident {id:'inc1'}), (i2:Incident {id:'inc2'}) CREATE (i1)-[:LINKED_TO {reason:'Same suspect area'}]->(i2)
    `);

    console.log('Seed complete!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();