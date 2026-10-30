# Manual técnico — USAC Analytics

## 1. Propósito y arquitectura

USAC Analytics analiza los CSV de pruebas específicas de Ingeniería USAC. Se eligió MongoDB para conservar evaluaciones como documentos y ejecutar agregaciones; Neo4j para conectar aspirantes, evaluaciones, materias, carreras, instituciones, ubicaciones y períodos.

El frontend **React + TypeScript** usa `fetch` contra una API **FastAPI**. Las consultas a las bases de datos solo se realizan desde el backend. Tecnologías auxiliares: Vite, Tailwind CSS, Recharts, Cytoscape.js, PyMongo y controlador oficial Neo4j.

## 2. Organización del repositorio

```text
backend/
  app/
    api/               # Rutas REST: estadísticas, grafos, búsqueda, importación
    db/                # Conexiones a MongoDB y Neo4j
    etl/               # transform.py, load_mongodb.py, load_neo4j.py
    services/          # Consultas y lógica de aplicación
    main.py            # Instancia FastAPI y routers
  requirements.txt
frontend/
  src/
    components/        # Componentes de layout, gráficas y resultados
    config/            # Catálogos de consultas
    pages/             # Seis vistas principales
    services/api.ts    # Cliente HTTP
    App.tsx            # Rutas React
scripts/               # Utilidades de análisis de CSV
database/neo4j/consultas/   # Consultas Cypher guardadas
data/raw/              # CSV originales/importados (normalmente ignorados en Git)
docs/                  # Manuales y análisis
```

## 3. Configuración

Copiar `.env.example` como `.env`; ajustar URI/usuario/contraseña reales de Neo4j. Requisitos: MongoDB funcionando, Neo4j activo, Python y Node. Instalar dependencias con `pip install -r backend/requirements.txt` y `npm install` en `frontend/`.

Desde raíz:

```bash
source backend/.venv/bin/activate
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Desde `frontend/`, en otra terminal:

```bash
npm run dev
```

Validar `/docs`, `/api/health/mongodb` y `/api/health/neo4j` en backend.

## 4. Origen y ETL

Origen: https://datosabiertos.ingenieria.usac.edu.gt/en/dataset/pruebas-especificas, 2015–2024.

1. `transform.py` normaliza nombres alternativos de cabeceras (especialmente 2022–2024), recorta espacios, valida obligatorios y convierte fecha, año e intento.
2. `SIN REGISTRO` en nacimiento se representa como `null`, y `aprobacion` se interpreta como `aprobado: boolean`; `edad_aproximada = anio_de_ingreso - anio_nacimiento` cuando existe el año.
3. `load_mongodb.py` aplica `UpdateOne(..., upsert=True)` en lotes de 500, con índice único en `id_registro`, y registra `historial_cargas` y `errores_carga`.
4. `load_neo4j.py` transforma documentos al modelo de nodos y relaciones usando `MERGE`, en lotes de 500.
5. La carga web recibe hasta cinco CSV por solicitud, con tamaño máximo de 20 MiB cada uno. Devuelve total, válidos, rechazados, duración, errores y sincronizados. El frontend muestra esos resultados.

Para cargar un archivo CSV **ya ubicado en `data/raw/`** desde CLI (dentro de la carpeta `backend/`, con entorno activado):

```bash
python -m app.etl.load_mongodb "nombre.csv"
```

Para sincronizar todos los registros cargados en MongoDB con Neo4j desde `backend/`:

```bash
python -m app.etl.load_neo4j
```

**Precaución:** ejecutar la sincronización completa de Neo4j puede tardar. La importación por interfaz utiliza la sincronización específica del archivo.

## 5. Modelo documental MongoDB

Colección principal: `evaluaciones`. Cada documento representa una **evaluación**, no un aspirante único. Campos relevantes: `id_registro`, `correlativo_aspirante`, `fecha_asignacion`, `materia`, `numero_de_fecha_de_evaluacion`, `anio_de_ingreso`, `aprobacion`, `aprobado`, `carrera_objetivo`, `tipo_institucion_educativa`, `municipio_institucion_educativa`, `departamento_institucion_educativa`, `sexo`, `anio_nacimiento`, `edad_aproximada`, `archivo_origen` y `fila_origen`.

Colecciones auxiliares documentadas: `historial_cargas`, `errores_carga`, y `resumen_carrera` (generada mediante la consulta 6).

## 6. Modelo Neo4j

Etiquetas registradas: `Aspirante`, `Evaluacion`, `Materia`, `Carrera`, `InstitucionTipo`, `Municipio`, `Departamento` y `PeriodoIngreso`.

Relaciones:

- `(Aspirante)-[:REALIZO]->(Evaluacion)`
- `(Evaluacion)-[:EVALUA]->(Materia)`
- `(Evaluacion)-[:PARA_CARRERA]->(Carrera)`
- `(Evaluacion)-[:PROVIENE_DE_TIPO]->(InstitucionTipo)`
- `(Evaluacion)-[:PROCEDE_DE]->(Municipio)`
- `(Municipio)-[:PERTENECE_A]->(Departamento)`
- `(Evaluacion)-[:EN_PERIODO]->(PeriodoIngreso)`

El identificador anónimo del aspirante es `correlativo_aspirante`, y la identidad de cada evaluación es `id_registro`.

## 7. API y manejo de errores

- `/api/estadisticas/*`: 20 consultas MongoDB, incluida generación del resumen por carrera.
- `/api/grafos/*`: cinco consultas analíticas Cypher, además de `/visualizar/{correlativo}` para la estructura `nodes` / `edges` de Cytoscape.
- `/api/busqueda/evaluaciones`: filtros opcionales y paginación, máximo 100 filas por página.
- `/api/importacion/csv`: carga multipart de uno o varios archivos.

FastAPI devuelve códigos HTTP de error ante problemas de validación, no encontrados y fallos en los motores. Los errores de filas CSV se reportan por archivo y fila sin detener la importación de otras filas válidas.

## 8. Verificación de integridad

Consultas de control:

```javascript
// mongosh
use usac_pruebas_especificas
db.evaluaciones.countDocuments({})
```

```cypher
MATCH (e:Evaluacion) RETURN count(e) AS total;
```

```cypher
MATCH (e:Evaluacion)
RETURN count(e) AS total,
  sum(CASE WHEN EXISTS { MATCH (e)-[:EVALUA]->(:Materia) } THEN 1 ELSE 0 END) AS con_materia,
  sum(CASE WHEN EXISTS { MATCH (e)-[:PARA_CARRERA]->(:Carrera) } THEN 1 ELSE 0 END) AS con_carrera,
  sum(CASE WHEN EXISTS { MATCH (:Aspirante)-[:REALIZO]->(e) } THEN 1 ELSE 0 END) AS con_aspirante;
```

Resultados de referencia reportados en el entorno original (tras retirar el registro de prueba): cuatro columnas con **208,453**.

## 9. Limitaciones y posibles mejoras

- No hay transacción atómica global entre motores. Reintentar sincronización puede ser necesario tras fallos parciales.
- La identidad por archivo y número de fila no detecta duplicados semánticos entre CSV distintos.
- Una consulta exacta por cadena puede requerir usar el texto completo original, sin autocompletado.
- El entorno local no implementa controles de producción (autenticación, cuotas, despliegue seguro).
- No se incluye un editor libre de consultas; las consultas se ejecutan desde menús y en el backend.

## 10. Pruebas de compilación

```bash
python -m compileall -q backend/app
cd frontend && npm run build
```

Estas pruebas comprueban sintaxis/compilación, pero no sustituyen una batería automatizada completa de integración.
