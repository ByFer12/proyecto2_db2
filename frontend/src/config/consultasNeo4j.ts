export interface ConsultaNeo4j {
  id: number;
  nombre: string;
  descripcion: string;
  endpoint: string;
  requiereCorrelativo?: boolean;
  cypher: string;
}

export const consultasNeo4j: ConsultaNeo4j[] = [
  {
    id: 1,
    nombre: "Evaluaciones y aprobaciones por materia",
    descripcion:
      "Cuenta las evaluaciones, aprobaciones y tasas de aprobación de cada materia.",
    endpoint: "/aprobaciones-materia",
    cypher: `MATCH (e:Evaluacion)-[:EVALUA]->(m:Materia)
RETURN
    m.nombre AS materia,
    count(e) AS total_evaluaciones,
    sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas,
    round(100.0 * sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) / count(e), 2) AS porcentaje_aprobacion
ORDER BY total_evaluaciones DESC`,
  },
  {
    id: 2,
    nombre: "Aspirantes por departamento",
    descripcion:
      "Recorre aspirantes, evaluaciones, municipios y departamentos para identificar las principales procedencias.",
    endpoint: "/aspirantes-departamento",
    cypher: `MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
      -[:PROCEDE_DE]->(m:Municipio)
      -[:PERTENECE_A]->(d:Departamento)
RETURN
    d.nombre AS departamento,
    count(DISTINCT a) AS total_aspirantes,
    count(e) AS total_evaluaciones,
    sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS evaluaciones_aprobadas
ORDER BY total_aspirantes DESC
LIMIT 10`,
  },
  {
    id: 3,
    nombre: "Historial académico por aspirante",
    descripcion:
      "Recupera materias, intentos, resultados y carreras relacionadas con un aspirante.",
    endpoint: "/historial",
    requiereCorrelativo: true,
    cypher: `MATCH (a:Aspirante {correlativo: $correlativo})
      -[:REALIZO]->(e:Evaluacion)
      -[:EVALUA]->(m:Materia)
MATCH (e)-[:PARA_CARRERA]->(c:Carrera)
RETURN
    a.correlativo AS aspirante,
    toString(e.fecha_asignacion) AS fecha,
    m.nombre AS materia,
    e.intento AS intento,
    e.aprobado AS aprobado,
    c.nombre AS carrera,
    e.anio_ingreso AS anio_ingreso
ORDER BY anio_ingreso, fecha, materia, intento`,
  },
  {
    id: 4,
    nombre: "Carreras más demandadas por departamento",
    descripcion:
      "Identifica la carrera con más aspirantes dentro de cada departamento.",
    endpoint: "/carreras-departamento",
    cypher: `MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
      -[:PROCEDE_DE]->(m:Municipio)
      -[:PERTENECE_A]->(d:Departamento)
MATCH (e)-[:PARA_CARRERA]->(c:Carrera)
WHERE d.nombre <> "SIN DATOS" AND c.nombre <> "NINGUNO"
WITH d.nombre AS departamento, c.nombre AS carrera,
     count(DISTINCT a) AS aspirantes, count(e) AS evaluaciones
ORDER BY departamento, aspirantes DESC, carrera
WITH departamento, collect({carrera: carrera, aspirantes: aspirantes, evaluaciones: evaluaciones}) AS ranking
RETURN
    departamento,
    ranking[0].carrera AS carrera_mas_demandada,
    ranking[0].aspirantes AS total_aspirantes,
    ranking[0].evaluaciones AS total_evaluaciones
ORDER BY total_aspirantes DESC`,
  },
  {
    id: 5,
    nombre: "Desempeño por número de oportunidad",
    descripcion:
      "Compara las evaluaciones aprobadas y sus porcentajes según la materia y oportunidad.",
    endpoint: "/desempeno-intentos",
    cypher: `MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:EVALUA]->(m:Materia)
WHERE e.intento IS NOT NULL
WITH m.nombre AS materia, e.intento AS intento,
     count(e) AS total_evaluaciones,
     count(DISTINCT a) AS aspirantes_unicos,
     sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS evaluaciones_aprobadas
RETURN
    materia,
    intento,
    total_evaluaciones,
    aspirantes_unicos,
    evaluaciones_aprobadas,
    round(100.0 * evaluaciones_aprobadas / total_evaluaciones, 2) AS porcentaje_aprobacion
ORDER BY materia, intento`,
  },
];
