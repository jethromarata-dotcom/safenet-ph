# SafeNet PH
### Graph-Based Public Safety & Security Web Application
**ITD110 - NoSQL Databases | Case Study #2**

---

## PROJECT CONTEXT

SafeNet PH is a graph-database-driven web application designed for public safety intelligence and incident management in Philippine communities, specifically set in Iligan City. Traditional relational databases store safety data in flat, disconnected tables — but in reality, incidents, persons, locations, and agencies are deeply interconnected. A suspect may be linked to multiple incidents across different barangays; a location may be a recurring hotspot tied to specific agencies and witnesses. Neo4j's graph model captures these natural relationships natively, enabling queries like "find all persons connected to incidents in Poblacion, Iligan City" in a single traversal — impossible to do efficiently in SQL without complex multi-table joins.

The intended users are local government unit (LGU) public safety officers, barangay tanods, and DRRMO personnel who need a centralized, visual system to log incidents, track persons of interest, identify hotspot locations, and coordinate agency response — all through a browser-based interface with no specialized software required.

---

## SETUP INSTRUCTIONS

### PREREQUISITES
- Neo4j Desktop
- VS Code
- Node.js + NPM
- Git

---

### STEP 1 — Get the Project Files

**Option A: Clone from GitHub**
```bash
git clone https://github.com/YOUR_USERNAME/safenet-ph.git
cd safenet-ph
code .
```

**Option B: From ZIP file**
1. Unzip `safenet-ph.zip` to a folder of your choice
2. Open VS Code → File → Open Folder → select `safenet-ph`

---

### STEP 2 — Install Node Dependencies

Open the integrated terminal in VS Code (Ctrl + backtick) and run:
```bash
npm install
```
This installs: express, neo4j-driver, cors, dotenv

---

### STEP 3 — Set Up Neo4j

1. Open Neo4j Desktop
2. Start an existing Local DBMS or create a new one
3. Wait until it shows as Active/Started

---

### STEP 4 — Configure Environment Variables

In the project root folder:
```bash
cp .env.example .env
```

Then open `.env` and fill in your credentials:
```
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
PORT=3000
```

> Never commit `.env` to GitHub — it is already in `.gitignore`

---

### STEP 5 — Seed the Database

```bash
npm run seed
```

Expected output:
```
Clearing old data...
Seeding Locations...
Seeding Agencies...
Seeding Persons...
Seeding Incidents...
Seeding Relationships...
Seed complete!
```

If you see a connection error, make sure your Neo4j instance is running first.

---

### STEP 6 — Start the App

```bash
npm start
```

Then open your browser and go to:
```
http://localhost:3000
```

---

## PROJECT STRUCTURE

```
safenet-ph/
├── backend/
│   ├── server.js              ← Express server (entry point)
│   ├── neo4j.js               ← Neo4j driver connection
│   ├── seed.js                ← Sample data loader (Iligan City)
│   └── routes/
│       ├── incidents.js       ← CRUD API for Incidents
│       ├── persons.js         ← CRUD API for Persons
│       ├── locations.js       ← CRUD API for Locations
│       ├── agencies.js        ← CRUD API for Agencies
│       ├── links.js           ← Person-to-Incident relationship API
│       ├── stats.js           ← Dashboard statistics
│       └── backup.js          ← JSON export
├── frontend/
│   ├── index.html             ← Single-page application shell
│   ├── style.css              ← Dark tactical UI (Light/Dark mode)
│   └── app.js                 ← All frontend logic
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## GRAPH DATA MODEL

### Nodes
| Label | Properties |
|-------|-----------|
| Incident | id, title, type, severity, date, status |
| Person | id, name, role, age, status |
| Location | id, name, type, lat, lng |
| Agency | id, name, code, type |

### Relationships
| Relationship | Direction | Meaning |
|-------------|----------|---------|
| INVOLVED_IN | Person → Incident | Suspect/Victim role in incident |
| WITNESSED | Person → Incident | Person witnessed the incident |
| RESPONDED_TO | Person → Incident | Officer responded to incident |
| OCCURRED_AT | Incident → Location | Where the incident happened |
| RESPONDED_BY | Incident → Agency | Agency that handled the response |
| LINKED_TO | Incident → Incident | Related incidents |

---

## API REFERENCE

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | /api/stats | Dashboard data |
| GET | /api/incidents | List / search incidents |
| POST | /api/incidents | Create incident |
| PUT | /api/incidents/:id | Update incident |
| DELETE | /api/incidents/:id | Delete incident |
| GET | /api/persons | List / search persons |
| POST | /api/persons | Create person |
| PUT | /api/persons/:id | Update person |
| DELETE | /api/persons/:id | Delete person |
| GET | /api/locations | List / search locations |
| POST | /api/locations | Create location |
| PUT | /api/locations/:id | Update location |
| DELETE | /api/locations/:id | Delete location |
| GET | /api/agencies | List / search agencies |
| POST | /api/agencies | Create agency |
| PUT | /api/agencies/:id | Update agency |
| DELETE | /api/agencies/:id | Delete agency |
| POST | /api/links | Create person-to-incident relationship |
| DELETE | /api/links | Remove person-to-incident relationship |
| GET | /api/backup | Download full graph as JSON |

---

## FEATURES

- **Dashboard** — real-time stats, bar charts by type/severity/status, hotspot locations, recent incidents
- **Incidents CRUD** — create, read, update, delete incidents with location and agency linking
- **Persons CRUD** — manage suspects, victims, witnesses, and officers
- **Locations CRUD** — manage barangays, landmarks, districts with coordinates
- **Agencies CRUD** — manage responding agencies (police, fire, medical, DRRMO)
- **Map View** — interactive Iligan City map with incident markers; right-click to add locations directly on the map
- **Link Person** — connect persons to incidents via graph relationships; unlink as needed
- **Graph View** — force-directed graph visualization of all nodes and relationships; hover for full details
- **Search** — live search on incidents, persons, locations, and agencies
- **Light/Dark Mode** — toggle between themes
<<<<<<< HEAD
- **JSON Backup** — export the full graph database as a downloadable JSON file
=======
- **JSON Backup** — export the full graph database as a downloadable JSON file
>>>>>>> a587f6cdceef1034ee3f095a7f976bd1fb937fa9
