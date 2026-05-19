# SafeNet PH 🚨
### Graph-Based Public Safety & Security Web Application
**ITD110 - NoSQL Databases | Case Study #2**

---

## 📋 PROJECT CONTEXT

SafeNet PH is a graph-database-driven web application designed for public safety intelligence and incident management in Philippine communities. Traditional relational databases store safety data in flat, disconnected tables — but in reality, incidents, persons, locations, and agencies are deeply interconnected. A suspect may be linked to multiple incidents across different barangays; a location may be a recurring hotspot tied to specific agencies and witnesses. Neo4j's graph model captures these natural relationships natively, enabling queries like "find all persons connected to incidents in Poblacion" in a single traversal — impossible to do efficiently in SQL without complex multi-table joins.

The intended users are local government unit (LGU) public safety officers, barangay tanods, and DRRMO personnel who need a centralized, visual system to log incidents, track persons of interest, identify hotspot locations, and coordinate agency response — all through a browser-based interface with no specialized software required.

---

## ⚙️ STEP-BY-STEP SETUP INSTRUCTIONS

### PREREQUISITES (You Already Have These)
- Neo4j Desktop
- VS Code
- Node.js + NPM
- Git

---

### STEP 1 — Get the Project Files

**Option A: From the ZIP file**
1. Unzip `safenet-ph.zip` to a folder of your choice
2. Open VS Code → File → Open Folder → select `safenet-ph`

**Option B: Clone from GitHub (after uploading)**
```bash
git clone https://github.com/YOUR_USERNAME/safenet-ph.git
cd safenet-ph
code .
```

---

### STEP 2 — Install Node Dependencies

Open the integrated terminal in VS Code (Ctrl + backtick) and run:
```bash
npm install
```
This installs: express, neo4j-driver, cors, dotenv

---

### STEP 3 — Set Up Neo4j Database

1. Open Neo4j Desktop
2. Click "New" → "Create project" — name it SafeNet
3. Inside the project, click "Add" → "Local DBMS"
4. Name it SafeNetPH, set a password (e.g. safenet123), click Create
5. Click the Start button next to your DBMS — wait for it to turn green
6. (Optional) Click Open to open Neo4j Browser at http://localhost:7474

---

### STEP 4 — Configure Environment Variables

In the project root folder, copy the example file:
```bash
cp .env.example .env
```

Then open .env in VS Code and update your password:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=safenet123
PORT=3000
```

NOTE: Never commit .env to GitHub — it is already in .gitignore

---

### STEP 5 — Seed the Database with Sample Data

```bash
npm run seed
```

You should see:
```
Clearing old data...
Seeding Locations...
Seeding Agencies...
Seeding Persons...
Seeding Incidents...
Seeding Relationships...
Seed complete! Database is ready.
```

If you see a connection error, make sure Neo4j is running (Step 3).

---

### STEP 6 — Start the Web Server

```bash
npm start
```

Output:
```
SafeNet PH running at http://localhost:3000
API available at http://localhost:3000/api
```

---

### STEP 7 — Open the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the SafeNet PH dashboard with live data from Neo4j.

---

### STEP 8 — Test Core Features

| Feature | How to Test |
|--------|-------------|
| Dashboard | Loads automatically — shows totals, charts, hotspots |
| Incidents CRUD | Click Incidents → New Incident → fill form → Save. Edit/Delete on any row |
| Persons CRUD | Click Persons → New Person → fill form → Save |
| Locations CRUD | Click Locations → New Location → fill form → Save |
| Search | On any data page, type in the search box — results filter live |
| Graph View | Click Graph View — drag nodes to explore relationships |
| JSON Backup | Click Export JSON Backup in the sidebar — downloads a .json file |

---

### STEP 9 — Push to GitHub

1. Create a new public repository on github.com named safenet-ph
2. In your project terminal:

```bash
git init
git add .
git commit -m "Initial commit: SafeNet PH - Graph-based Public Safety App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/safenet-ph.git
git push -u origin main
```

---

## 📁 PROJECT STRUCTURE

```
safenet-ph/
├── backend/
│   ├── server.js              ← Express server (entry point)
│   ├── neo4j.js               ← Neo4j driver connection
│   ├── seed.js                ← Sample data loader
│   └── routes/
│       ├── incidents.js       ← CRUD API for Incidents
│       ├── persons.js         ← CRUD API for Persons
│       ├── locations.js       ← CRUD API for Locations
│       ├── stats.js           ← Dashboard statistics
│       └── backup.js          ← JSON export
├── frontend/
│   ├── index.html             ← Single-page application shell
│   ├── style.css              ← Dark tactical UI theme
│   └── app.js                 ← All frontend logic
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🗃️ GRAPH DATA MODEL

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
| RESPONDED_TO | Person → Incident | Officer responded |
| OCCURRED_AT | Incident → Location | Where it happened |
| RESPONDED_BY | Incident → Agency | Agency that handled it |
| LINKED_TO | Incident → Incident | Related incidents |

---

## 🔌 API REFERENCE

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
| GET | /api/locations | List locations |
| POST | /api/locations | Create location |
| PUT | /api/locations/:id | Update location |
| DELETE | /api/locations/:id | Delete location |
| GET | /api/backup | Download full JSON backup |

---

## WHY NEO4J FOR THIS DOMAIN?

In SQL, finding all persons linked to incidents at a specific location handled by a specific agency requires 4+ table joins with performance costs. In Neo4j Cypher:

```cypher
MATCH (p:Person)-[:INVOLVED_IN]->(i:Incident)-[:OCCURRED_AT]->(l:Location {name:'Poblacion, Davao City'})
MATCH (i)-[:RESPONDED_BY]->(a:Agency {code:'DCPO'})
RETURN p, i, l
```

Traversing relationships is a first-class operation in Neo4j — not an expensive join. Public safety data is inherently a graph, and Neo4j models it naturally.
