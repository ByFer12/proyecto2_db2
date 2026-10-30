# Documentación de cinco consultas Neo4j (Cypher)

Las consultas ejecutadas por la API están implementadas en `backend/app/services/grafos.py`. También se guardaron archivos `.cypher` dentro de `database/neo4j/consultas/` durante el desarrollo. Este documento resume sus objetivos, recorridos y ejemplos de Cypher basados en el código revisado.

## 1. Evaluaciones y aprobaciones por materia

**Ruta:** `GET /api/grafos/aprobaciones-materia`

```cypher
MATCH (e:Evaluacion)-[:EVALUA]->(m:Materia)
RETURN m.nombre AS materia,
       count(e) AS total_evaluaciones,
       sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas,
       round(100.0 * sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) / count(e), 2) AS porcentaje_aprobacion
ORDER BY total_evaluaciones DESC;
```

Permite identificar la cantidad y proporción de aprobaciones de cada materia.

## 2. Aspirantes por departamento

**Ruta:** `GET /api/grafos/aspirantes-departamento`

```cypher
MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
      -[:PROCEDE_DE]->(m:Municipio)-[:PERTENECE_A]->(d:Departamento)
RETURN d.nombre AS departamento,
       count(DISTINCT a) AS total_aspirantes,
       count(e) AS total_evaluaciones,
       sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS evaluaciones_aprobadas
ORDER BY total_aspirantes DESC
LIMIT 10;
```

Demuestra un recorrido desde aspirantes y evaluaciones hasta ubicaciones y distingue aspirantes únicos de evaluaciones realizadas.

## 3. Historial académico de aspirante

**Ruta:** `GET /api/grafos/historial/{correlativo}`

```cypher
MATCH (a:Aspirante {correlativo: $correlativo})-[:REALIZO]->(e:Evaluacion)-[:EVALUA]->(m:Materia)
MATCH (e)-[:PARA_CARRERA]->(c:Carrera)
RETURN a.correlativo AS aspirante,
       toString(e.fecha_asignacion) AS fecha,
       m.nombre AS materia, e.intento AS intento,
       e.aprobado AS aprobado, c.nombre AS carrera,
       e.anio_ingreso AS anio_ingreso
ORDER BY anio_ingreso, fecha, materia, intento;
```

Traza las evaluaciones de un aspirante anónimo y sus resultados, carreras e intentos.

## 4. Carrera más demandada por departamento

**Ruta:** `GET /api/grafos/carreras-departamento`

```cypher
MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:PROCEDE_DE]->(m:Municipio)-[:PERTENECE_A]->(d:Departamento)
MATCH (e)-[:PARA_CARRERA]->(c:Carrera)
WHERE d.nombre <> 'SIN DATOS' AND c.nombre <> 'NINGUNO'
WITH d.nombre AS departamento, c.nombre AS carrera,
     count(DISTINCT a) AS aspirantes, count(e) AS evaluaciones
ORDER BY departamento, aspirantes DESC, carrera
WITH departamento,
     collect({carrera: carrera, aspirantes: aspirantes, evaluaciones: evaluaciones}) AS ranking
RETURN departamento,
       ranking[0].carrera AS carrera_mas_demandada,
       ranking[0].aspirantes AS total_aspirantes,
       ranking[0].evaluaciones AS total_evaluaciones
ORDER BY total_aspirantes DESC;
```

Encuentra la carrera más solicitada por cada departamento mediante recorrido, agregación y ordenación.

## 5. Desempeño por número de oportunidad

**Ruta:** `GET /api/grafos/desempeno-intentos`

```cypher
MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:EVALUA]->(m:Materia)
WHERE e.intento IS NOT NULL
WITH m.nombre AS materia, e.intento AS intento,
     count(e) AS total_evaluaciones,
     count(DISTINCT a) AS aspirantes_unicos,
     sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS evaluaciones_aprobadas
RETURN materia, intento, total_evaluaciones, aspirantes_unicos,
       evaluaciones_aprobadas,
       round(100.0 * evaluaciones_aprobadas / total_evaluaciones, 2) AS porcentaje_aprobacion
ORDER BY materia, intento;
```

Compara resultados por materia y oportunidad de evaluación.

## Explorador visual (consulta adicional)

`GET /api/grafos/visualizar/{correlativo}` devuelve nodos y relaciones `REALIZO`, `EVALUA` y `PARA_CARRERA` para renderizar en Cytoscape. Limita inicialmente a 50 evaluaciones por aspirante para mantener la visualización legible.
