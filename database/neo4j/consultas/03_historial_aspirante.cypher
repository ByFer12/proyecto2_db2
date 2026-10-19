/*
Una vez que tengas un correlativo del resultado anterior, sustituye CORRELATIVO_AQUI en esta consulta
*/


MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
WITH a, count(e) AS total
ORDER BY total DESC
LIMIT 1

MATCH (a)-[:REALIZO]->(ev:Evaluacion)
MATCH (ev)-[:EVALUA]->(m:Materia)
MATCH (ev)-[:PARA_CARRERA]->(c:Carrera)

RETURN
    a.correlativo AS aspirante,
    ev.fecha_asignacion AS fecha,
    m.nombre AS materia,
    ev.intento AS intento,
    ev.aprobado AS aprobado,
    c.nombre AS carrera,
    ev.anio_ingreso AS anio_ingreso

ORDER BY anio_ingreso, fecha, materia, intento;