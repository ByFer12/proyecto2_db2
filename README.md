# Proyecto 2 — Sistemas de Bases de Datos 2 (USAC)

Sistema de almacenamiento, procesamiento ETL, análisis estadístico y visualización de grafos para el dataset oficial de **Pruebas Específicas de la Facultad de Ingeniería (2015–2024)** utilizando **MongoDB**, **Neo4j**, **FastAPI** y **React + TypeScript**.

📄 **[Ver Informe Completo, Documentación de Consultas, Análisis de Resultados y Manuales en `docs/INFORME_PROYECTO2.md`](docs/INFORME_PROYECTO2.md)**

---

## Estructura del Repositorio

```text
proyecto2/
├── backend/                  # API REST en FastAPI + Proceso ETL (MongoDB & Neo4j)
│   ├── app/
│   │   ├── api/              # Endpoints REST (estadísticas, grafos, búsqueda, importación)
│   │   ├── db/               # Conexiones a MongoDB y Neo4j
│   │   ├── etl/              # Extracción, limpieza y carga (transform, load_mongodb, load_neo4j)
│   │   ├── services/         # 20 consultas MongoDB, 5 consultas Cypher + consolas dinámicas
│   │   └── main.py           # Punto de entrada FastAPI
│   └── requirements.txt
├── frontend/                 # Aplicación Web (React 19 + TypeScript + Tailwind CSS + Recharts + Cytoscape)
│   └── src/
│       ├── components/       # Visualizador de grafos Cytoscape, gráficas dinámicas y tablas
│       ├── config/           # Catálogo de consultas MongoDB y Neo4j
│       ├── pages/            # Dashboard, MongoDB, Neo4j, Explorador de Grafos, Buscador, Importar CSV
│       └── services/         # Cliente HTTP API
├── database/
│   └── neo4j/consultas/      # Scripts Cypher (.cypher) de las 5 consultas de grafos
├── data/raw/                 # Archivos CSV de pruebas específicas (2015–2024)
├── scripts/                  # Scripts de análisis exploratorio de calidad de datos
└── docs/
    └── INFORME_PROYECTO2.md  # Informe completo, manual técnico, manual de usuario y conclusiones
```

---

## Ejecución Rápida

### 1. Variables de entorno (`.env` en la raíz)
```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=usac_pruebas_especificas
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_password
NEO4J_DATABASE=neo4j
```

### 2. Iniciar Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Iniciar Frontend
```bash
cd frontend
npm install
npm run dev
```
