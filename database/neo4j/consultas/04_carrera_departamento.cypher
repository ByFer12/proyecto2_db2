
/*
¿Cuáles son las carreras con más aspirantes en cada departamento?

Esta consulta recorrerá cinco tipos de nodos:

Aspirante → Evaluacion → Municipio → Departamento
*/


MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
      -[:PROCEDE_DE]->(m:Municipio)
      -[:PERTENECE_A]->(d:Departamento)

MATCH (e)-[:PARA_CARRERA]->(c:Carrera)

WHERE d.nombre <> "SIN DATOS"
  AND c.nombre <> "NINGUNO"

WITH
    d.nombre AS departamento,
    c.nombre AS carrera,
    count(DISTINCT a) AS aspirantes,
    count(e) AS evaluaciones

ORDER BY departamento, aspirantes DESC, carrera

WITH
    departamento,
    collect({
        carrera: carrera,
        aspirantes: aspirantes,
        evaluaciones: evaluaciones
    }) AS ranking

RETURN
    departamento,
    ranking[0].carrera AS carrera_mas_demandada,
    ranking[0].aspirantes AS total_aspirantes,
    ranking[0].evaluaciones AS total_evaluaciones

ORDER BY total_aspirantes DESC;