
/*
Aprobaciones por materia
Cuenta evaluaciones, aprobaciones y calcula
el porcentaje de aprobación de cada materia.
*/

MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
      -[:PROCEDE_DE]->(m:Municipio)
      -[:PERTENECE_A]->(d:Departamento)

RETURN
    d.nombre AS departamento,
    count(DISTINCT a) AS total_aspirantes,
    count(e) AS total_evaluaciones,
    sum(
        CASE
            WHEN e.aprobado = true THEN 1
            ELSE 0
        END
    ) AS evaluaciones_aprobadas

ORDER BY total_aspirantes DESC
LIMIT 10;