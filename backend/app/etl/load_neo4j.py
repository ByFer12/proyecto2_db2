
import time

from app.db.mongodb import db
from app.db.neo4j import driver, NEO4J_DATABASE


BATCH_SIZE = 500

CONSULTA_CYPHER = """
UNWIND $registros AS fila

MERGE (a:Aspirante {
    correlativo: fila.correlativo
})

MERGE (e:Evaluacion {
    id_registro: fila.id_registro
})
SET
    e.anio_ingreso = fila.anio_ingreso,
    e.intento = fila.intento,
    e.aprobado = fila.aprobado,
    e.fecha_asignacion = fila.fecha_asignacion,
    e.sexo = fila.sexo,
    e.anio_nacimiento = fila.anio_nacimiento,
    e.edad_aproximada = fila.edad_aproximada

MERGE (m:Materia {
    nombre: fila.materia
})

MERGE (c:Carrera {
    nombre: fila.carrera
})

MERGE (i:InstitucionTipo {
    nombre: fila.tipo_institucion
})

MERGE (d:Departamento {
    nombre: fila.departamento
})

MERGE (mu:Municipio {
    clave: fila.clave_municipio
})
SET mu.nombre = fila.municipio

MERGE (p:PeriodoIngreso {
    anio: fila.anio_ingreso
})

MERGE (a)-[:REALIZO]->(e)
MERGE (e)-[:EVALUA]->(m)
MERGE (e)-[:PARA_CARRERA]->(c)
MERGE (e)-[:PROVIENE_DE_TIPO]->(i)
MERGE (e)-[:PROCEDE_DE]->(mu)
MERGE (mu)-[:PERTENECE_A]->(d)
MERGE (e)-[:EN_PERIODO]->(p)
"""


def preparar_registro(doc):
    departamento = (
        doc.get("departamento_institucion_educativa")
        or "SIN DATOS"
    )

    municipio = (
        doc.get("municipio_institucion_educativa")
        or "SIN DATOS"
    )

    return {
        "id_registro": doc["id_registro"],
        "correlativo": doc["correlativo_aspirante"],
        "materia": doc.get("materia") or "SIN DATOS",
        "carrera": doc.get("carrera_objetivo") or "SIN DATOS",
        "anio_ingreso": doc["anio_de_ingreso"],
        "intento": doc["numero_de_fecha_de_evaluacion"],
        "aprobado": doc["aprobado"],
        "fecha_asignacion": doc["fecha_asignacion"],
        "sexo": doc.get("sexo"),
        "anio_nacimiento": doc.get("anio_nacimiento"),
        "edad_aproximada": doc.get("edad_aproximada"),
        "tipo_institucion": (
            doc.get("tipo_institucion_educativa")
            or "SIN DATOS"
        ),
        "departamento": departamento,
        "municipio": municipio,
        "clave_municipio": f"{departamento}|{municipio}",
    }


def insertar_lote(tx, registros):
    resultado = tx.run(
        CONSULTA_CYPHER,
        registros=registros
    )
    resultado.consume()


def importar_todo():
    coleccion = db["evaluaciones"]

    total = coleccion.count_documents({})
    procesados = 0
    numero_lote = 0
    lote = []

    inicio = time.perf_counter()

    print(f"Total de evaluaciones: {total}", flush=True)
    print("Iniciando importación a Neo4j...", flush=True)

    cursor = coleccion.find(
        {},
        no_cursor_timeout=True
    ).batch_size(BATCH_SIZE)

    try:
        with driver.session(
            database=NEO4J_DATABASE
        ) as session:

            for documento in cursor:
                registro = preparar_registro(documento)
                lote.append(registro)

                if len(lote) == BATCH_SIZE:
                    session.execute_write(
                        insertar_lote,
                        lote
                    )

                    procesados += len(lote)
                    numero_lote += 1

                    porcentaje = (
                        procesados / total * 100
                        if total else 100
                    )

                    print(
                        f"Lote {numero_lote} | "
                        f"{procesados}/{total} | "
                        f"{porcentaje:.2f}%",
                        flush=True
                    )

                    lote.clear()

            # Procesar el último lote incompleto
            if lote:
                session.execute_write(
                    insertar_lote,
                    lote
                )

                procesados += len(lote)
                numero_lote += 1

                print(
                    f"Lote final {numero_lote} | "
                    f"{procesados}/{total}",
                    flush=True
                )

    finally:
        cursor.close()

    duracion = time.perf_counter() - inicio

    print("\n=== RESULTADO ===")
    print(f"Registros procesados: {procesados}")
    print(f"Lotes completados: {numero_lote}")
    print(f"Duración: {duracion:.2f} segundos")
    print("Importación terminada correctamente.")


if __name__ == "__main__":
    try:
        importar_todo()
    except Exception as error:
        print(f"\nERROR de importación: {error}")
        raise
    finally:
        driver.close()
