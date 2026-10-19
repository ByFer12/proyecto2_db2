/*
¿Qué materias evaluó un aspirante, cuántos intentos realizó y cuáles fueron sus resultados?
*/

MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
WITH a, count(e) AS total_evaluaciones
WHERE total_evaluaciones >= 3
RETURN
    a.correlativo AS aspirante,
    total_evaluaciones
ORDER BY total_evaluaciones DESC
LIMIT 5;