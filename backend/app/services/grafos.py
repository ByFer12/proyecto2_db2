
from app.db.neo4j import driver, NEO4J_DATABASE


def aprobaciones_por_materia():
    consulta = """
    MATCH (e:Evaluacion)-[:EVALUA]->(m:Materia)

    RETURN
        m.nombre AS materia,
        count(e) AS total_evaluaciones,
        sum(
            CASE
                WHEN e.aprobado = true THEN 1
                ELSE 0
            END
        ) AS aprobadas,
        round(
            100.0 * sum(
                CASE
                    WHEN e.aprobado = true THEN 1
                    ELSE 0
                END
            ) / count(e),
            2
        ) AS porcentaje_aprobacion

    ORDER BY total_evaluaciones DESC
    """

    with driver.session(
        database=NEO4J_DATABASE
    ) as session:
        resultado = session.run(consulta)
        return [registro.data() for registro in resultado]


def aspirantes_por_departamento():
    consulta = """
    MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
          -[:PROCEDE_DE]->(m:Municipio)
          -[:PERTENECE_A]->(d:Departamento)

    RETURN
        d.nombre AS departamento,
        count(DISTINCT a) AS total_aspirantes,
        count(e) AS total_evaluaciones,
        sum(CASE WHEN e.aprobado = true
            THEN 1 ELSE 0 END) AS evaluaciones_aprobadas

    ORDER BY total_aspirantes DESC
    LIMIT 10
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        resultado = session.run(consulta)
        return [r.data() for r in resultado]


def historial_aspirante_grafo(correlativo: str):
    consulta = """
    MATCH (a:Aspirante {correlativo: $correlativo})
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

    ORDER BY anio_ingreso, fecha, materia, intento
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        resultado = session.run(
            consulta,
            correlativo=correlativo
        )
        return [r.data() for r in resultado]


def carreras_por_departamento():
    consulta = """
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

    WITH departamento,
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

    ORDER BY total_aspirantes DESC
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        resultado = session.run(consulta)
        return [r.data() for r in resultado]


def desempeno_por_intentos():
    consulta = """
    MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)
          -[:EVALUA]->(m:Materia)

    WHERE e.intento IS NOT NULL

    WITH
        m.nombre AS materia,
        e.intento AS intento,
        count(e) AS total_evaluaciones,
        count(DISTINCT a) AS aspirantes_unicos,
        sum(CASE WHEN e.aprobado = true
            THEN 1 ELSE 0 END) AS evaluaciones_aprobadas

    RETURN
        materia,
        intento,
        total_evaluaciones,
        aspirantes_unicos,
        evaluaciones_aprobadas,
        round(
            100.0 * evaluaciones_aprobadas /
            total_evaluaciones, 2
        ) AS porcentaje_aprobacion

    ORDER BY materia, intento
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        resultado = session.run(consulta)
        return [r.data() for r in resultado]




def visualizar_grafo_aspirante(correlativo: str):
    consulta = """
    MATCH (a:Aspirante {correlativo: $correlativo})
          -[:REALIZO]->(e:Evaluacion)
          -[:EVALUA]->(m:Materia)

    MATCH (e)-[:PARA_CARRERA]->(c:Carrera)

    RETURN
        a.correlativo AS aspirante,
        elementId(e) AS evaluacion_id,
        e.intento AS intento,
        e.aprobado AS aprobado,
        toString(e.fecha_asignacion) AS fecha,
        m.nombre AS materia,
        c.nombre AS carrera
    ORDER BY fecha, materia, intento
    LIMIT 50
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        registros = [
            r.data()
            for r in session.run(
                consulta,
                correlativo=correlativo
            )
        ]

    nodos = {}
    relaciones = []

    if not registros:
        return {"nodes": [], "edges": []}

    aspirante_id = f"aspirante:{correlativo}"

    nodos[aspirante_id] = {
        "data": {
            "id": aspirante_id,
            "label": f"Aspirante {correlativo}",
            "tipo": "Aspirante"
        }
    }

    for registro in registros:
        evaluacion_id = f"evaluacion:{registro['evaluacion_id']}"
        materia_id = f"materia:{registro['materia']}"
        carrera_id = f"carrera:{registro['carrera']}"

        nodos[evaluacion_id] = {
            "data": {
                "id": evaluacion_id,
                "label": f"Evaluación {registro['intento']}",
                "tipo": "Evaluacion",
                "aprobado": registro["aprobado"],
                "fecha": registro["fecha"],
                "intento": registro["intento"]
            }
        }

        nodos[materia_id] = {
            "data": {
                "id": materia_id,
                "label": registro["materia"],
                "tipo": "Materia"
            }
        }

        nodos[carrera_id] = {
            "data": {
                "id": carrera_id,
                "label": registro["carrera"],
                "tipo": "Carrera"
            }
        }

        relaciones.extend([
            {
                "data": {
                    "source": aspirante_id,
                    "target": evaluacion_id,
                    "label": "REALIZO"
                }
            },
            {
                "data": {
                    "source": evaluacion_id,
                    "target": materia_id,
                    "label": "EVALUA"
                }
            },
            {
                "data": {
                    "source": evaluacion_id,
                    "target": carrera_id,
                    "label": "PARA_CARRERA"
                }
            }
        ])

    return {
        "nodes": list(nodos.values()),
        "edges": relaciones
    }
