# USAC Analytics — Proyecto 2 de Bases de Datos 2

Aplicación web para importar, transformar, consultar y visualizar datos de **pruebas específicas de aspirantes de primer ingreso a Ingeniería, USAC** mediante MongoDB y Neo4j.

## Funcionalidades

- Carga de uno o varios CSV, con validación por fila, reporte de errores, tiempo y resultado de sincronización.
- Dashboard con indicadores y gráficas por materia y año.
- 20 consultas analíticas de MongoDB desde la interfaz.
- 5 consultas de Neo4j desde la interfaz.
- Explorador interactivo de grafos por correlativo de aspirante (Cytoscape.js).
- Buscador de evaluaciones por materia, carrera, departamento, municipio, tipo de institución, sexo, año, estado y correlativo; resultados paginados.

## Arquitectura

`React + TypeScript + Vite + Tailwind CSS` → `FastAPI (Python)` → `MongoDB + Neo4j`.

El frontend consume exclusivamente la API; no se conecta directamente a los motores NoSQL.

## Requisitos

- Python 3.12 o versión compatible con `backend/requirements.txt`.
- Node.js y npm compatibles con la versión de Vite indicada en `frontend/package.json`.
- MongoDB local disponible en `localhost:27017` (o ajustar URI).
- Neo4j local disponible en `127.0.0.1:7687`, con usuario y contraseña configurados.

## Puesta en marcha (Ubuntu)

Desde la raíz del repositorio:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
```

Editar `.env` con las credenciales de la instancia Neo4j propia. **Nunca subir `.env` a GitHub.**

Iniciar backend desde la raíz:

```bash
uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Documentación API: http://127.0.0.1:8000/docs
- Salud del sistema: http://127.0.0.1:8000/api/health (ver rutas específicas para MongoDB y Neo4j)

**Nota sobre los datos:** los CSV originales no están necesariamente versionados. Obtenerlos de la fuente oficial indicada a continuación e importarlos desde `/importar`, o depositarlos en `data/raw/` para utilizar los scripts ETL. La importación inicial de archivos grandes puede tardar y requiere ambos motores en ejecución.

## Fuente de datos

[Datos Abiertos — Pruebas específicas, Facultad de Ingeniería, USAC](https://datosabiertos.ingenieria.usac.edu.gt/en/dataset/pruebas-especificas). Conjunto utilizado en el desarrollo: archivos correspondientes a 2015–2024.

## Módulos de la interfaz

| Ruta | Propósito |
| --- | --- |
| `/` | Dashboard de estadísticas |
| `/mongodb` | Consultas de MongoDB |
| `/neo4j` | Consultas analíticas sobre el grafo |
| `/explorador` | Grafo interactivo de un aspirante |
| `/buscador` | Búsqueda filtrada y paginada |
| `/importar` | Importación de uno o varios CSV |

## Documentación

- [Manual técnico](docs/manual_tecnico.md)
- [Manual de usuario](docs/manual_usuario.md)
- [Consultas MongoDB](docs/consultas_mongodb.md)
- [Consultas Neo4j](docs/consultas_neo4j.md)
- [Análisis de resultados](docs/analisis_resultados.md)
- [Conclusiones](docs/conclusiones.md)
- [Verificación de requisitos](docs/matriz_cumplimiento.md)

## Pruebas realizadas

En el entorno de desarrollo se reportaron 208,453 evaluaciones, 42,371 nodos `Aspirante` y 208,453 nodos `Evaluacion`. Se comprobó la visualización de consultas, filtros, carga CSV, tratamiento de errores y sincronización con Neo4j. Esas cifras son referencias del conjunto inicial, **no** datos precargados automáticamente por clonar el repositorio.

## Seguridad y limitaciones conocidas

- Mantener credenciales exclusivamente en `.env` y fuera del control de versiones.
- El módulo CSV utiliza validación y tamaño máximo por archivo; no exponer la aplicación pública sin autenticación, autorización, rate limiting y controles adicionales.
- La sincronización entre MongoDB y Neo4j no es una transacción distribuida: un fallo entre ambas operaciones puede requerir reintentar la sincronización.
- La identidad `id_registro` se deriva de nombre de archivo + número de fila; archivos diferentes pueden contener registros lógicamente repetidos aunque no dupliquen ese identificador.
- Revisar la correspondencia exacta entre filtros y valores de las fuentes CSV; algunas categorías usan convenciones distintas.

## Uso responsable y defensa

El código, documentación y consultas deben revisarse, comprenderse y poder modificarse por el autor durante la evaluación. Para explicar el ETL y el modelo consultar el manual técnico y los propios archivos de servicio.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        