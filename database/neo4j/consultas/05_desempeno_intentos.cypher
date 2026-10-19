/*
¿Cuántos aspirantes aprobaron alguna vez una materia y cómo cambia el porcentaje de aprobación según el número de oportunidad?

*/


MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
      -[:EVALUA]->(m:Materia)

WHERE e.intento IS NOT NULL

WITH
    m.nombre AS materia,
    e.intento AS intento,
    count(e) AS total_evaluaciones,
    count(DISTINCT a) AS aspirantes_unicos,
    sum(
        CASE WHEN e.aprobado = true
        THEN 1 ELSE 0 END
    ) AS evaluaciones_aprobadas

RETURN
    materia,
    intento,
    total_evaluaciones,
    aspirantes_unicos,
    evaluaciones_aprobadas,
    round(
        100.0 * evaluaciones_aprobadas /
        total_evaluaciones,
        2
    ) AS porcentaje_aprobacion

ORDER BY materia, intento;