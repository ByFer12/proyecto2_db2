
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




def visualizar_grafo_aspirante(
    correlativo: str,
    aprobado: bool | None = None,
    materia: str | None = None,
    anio_ingreso: int | None = None,
    intento: int | None = None,
    incluir_contexto: bool = True,
):
    consulta = """
    MATCH (a:Aspirante {correlativo: $correlativo})
          -[:REALIZO]->(e:Evaluacion)
          -[:EVALUA]->(m:Materia)
    MATCH (e)-[:PARA_CARRERA]->(c:Carrera)
    OPTIONAL MATCH (e)-[:PROVIENE_DE_TIPO]->(i:InstitucionTipo)
    OPTIONAL MATCH (e)-[:PROCEDE_DE]->(mu:Municipio)-[:PERTENECE_A]->(d:Departamento)
    OPTIONAL MATCH (e)-[:EN_PERIODO]->(p:PeriodoIngreso)
    WHERE ($aprobado IS NULL OR e.aprobado = $aprobado)
      AND ($materia IS NULL OR toUpper(m.nombre) = toUpper($materia))
      AND ($anio_ingreso IS NULL OR e.anio_ingreso = $anio_ingreso)
      AND ($intento IS NULL OR e.intento = $intento)
    RETURN
        a.correlativo AS aspirante,
        elementId(e) AS evaluacion_id,
        e.id_registro AS id_registro,
        e.intento AS intento,
        e.aprobado AS aprobado,
        e.anio_ingreso AS anio_ingreso,
        e.sexo AS sexo,
        e.anio_nacimiento AS anio_nacimiento,
        e.edad_aproximada AS edad_aproximada,
        toString(e.fecha_asignacion) AS fecha,
        m.nombre AS materia,
        c.nombre AS carrera,
        coalesce(i.nombre, "SIN DATOS") AS tipo_institucion,
        coalesce(mu.nombre, "SIN DATOS") AS municipio,
        coalesce(mu.clave, "SIN DATOS") AS clave_municipio,
        coalesce(d.nombre, "SIN DATOS") AS departamento,
        coalesce(p.anio, e.anio_ingreso) AS periodo_anio
    ORDER BY e.anio_ingreso, fecha, materia, intento
    LIMIT 80
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        registros = [
            r.data()
            for r in session.run(
                consulta,
                correlativo=correlativo,
                aprobado=aprobado,
                materia=materia,
                anio_ingreso=anio_ingreso,
                intento=intento,
            )
        ]

    nodos = {}
    relaciones_map = {}

    if not registros:
        return {
            "nodes": [],
            "edges": [],
            "resumen": {
                "total_evaluaciones": 0,
                "aprobadas": 0,
                "reprobadas": 0,
                "tasa_aprobacion": 0,
                "materias": [],
                "carreras": [],
            },
        }

    primero = registros[0]
    aspirante_id = f"aspirante:{correlativo}"

    nodos[aspirante_id] = {
        "data": {
            "id": aspirante_id,
            "label": f"Aspirante\n{correlativo[:8]}…",
            "correlativo": correlativo,
            "sexo": primero.get("sexo") or "S/D",
            "anio_nacimiento": primero.get("anio_nacimiento"),
            "edad_aproximada": primero.get("edad_aproximada"),
            "tipo": "Aspirante",
        }
    }

    def agregar_relacion(source: str, target: str, label: str):
        edge_id = f"{source}->{label}->{target}"
        if edge_id not in relaciones_map:
            relaciones_map[edge_id] = {
                "data": {
                    "id": edge_id,
                    "source": source,
                    "target": target,
                    "label": label,
                }
            }

    materias_set = set()
    carreras_set = set()
    aprobadas_count = 0

    for registro in registros:
        evaluacion_id = f"evaluacion:{registro['evaluacion_id']}"
        materia_nombre = registro["materia"]
        carrera_nombre = registro["carrera"]
        materia_id = f"materia:{materia_nombre}"
        carrera_id = f"carrera:{carrera_nombre}"

        es_aprobado = bool(registro["aprobado"])
        if es_aprobado:
            aprobadas_count += 1

        materias_set.add(materia_nombre)
        carreras_set.add(carrera_nombre)

        fecha_corta = (registro["fecha"] or "")[:10]
        estado_txt = "Aprobado" if es_aprobado else "No aprobado"

        nodos[evaluacion_id] = {
            "data": {
                "id": evaluacion_id,
                "label": f"Intento #{registro['intento']}\n({registro['anio_ingreso']})",
                "tipo": "Evaluacion",
                "aprobado": es_aprobado,
                "estado": estado_txt,
                "fecha": fecha_corta,
                "intento": registro["intento"],
                "anio_ingreso": registro["anio_ingreso"],
                "materia": materia_nombre,
                "carrera": carrera_nombre,
                "tipo_institucion": registro["tipo_institucion"],
                "municipio": registro["municipio"],
                "departamento": registro["departamento"],
            }
        }

        nodos[materia_id] = {
            "data": {
                "id": materia_id,
                "label": materia_nombre,
                "nombre": materia_nombre,
                "tipo": "Materia",
            }
        }

        nodos[carrera_id] = {
            "data": {
                "id": carrera_id,
                "label": carrera_nombre,
                "nombre": carrera_nombre,
                "tipo": "Carrera",
            }
        }

        agregar_relacion(aspirante_id, evaluacion_id, "REALIZO")
        agregar_relacion(evaluacion_id, materia_id, "EVALUA")
        agregar_relacion(evaluacion_id, carrera_id, "PARA_CARRERA")

        if incluir_contexto:
            tipo_inst = registro.get("tipo_institucion")
            if tipo_inst and tipo_inst != "SIN DATOS":
                inst_id = f"institucion:{tipo_inst}"
                nodos[inst_id] = {
                    "data": {
                        "id": inst_id,
                        "label": tipo_inst,
                        "nombre": tipo_inst,
                        "tipo": "InstitucionTipo",
                    }
                }
                agregar_relacion(evaluacion_id, inst_id, "PROVIENE_DE_TIPO")

            municipio_nombre = registro.get("municipio")
            depto_nombre = registro.get("departamento")
            if municipio_nombre and municipio_nombre != "SIN DATOS":
                mun_id = f"municipio:{registro['clave_municipio']}"
                nodos[mun_id] = {
                    "data": {
                        "id": mun_id,
                        "label": municipio_nombre,
                        "nombre": municipio_nombre,
                        "departamento": depto_nombre,
                        "tipo": "Municipio",
                    }
                }
                agregar_relacion(evaluacion_id, mun_id, "PROCEDE_DE")

                if depto_nombre and depto_nombre != "SIN DATOS":
                    depto_id = f"departamento:{depto_nombre}"
                    nodos[depto_id] = {
                        "data": {
                            "id": depto_id,
                            "label": depto_nombre,
                            "nombre": depto_nombre,
                            "tipo": "Departamento",
                        }
                    }
                    agregar_relacion(mun_id, depto_id, "PERTENECE_A")

            periodo_anio = registro.get("periodo_anio")
            if periodo_anio is not None:
                periodo_id = f"periodo:{periodo_anio}"
                nodos[periodo_id] = {
                    "data": {
                        "id": periodo_id,
                        "label": f"Ingreso {periodo_anio}",
                        "anio": periodo_anio,
                        "tipo": "PeriodoIngreso",
                    }
                }
                agregar_relacion(evaluacion_id, periodo_id, "EN_PERIODO")

    total_eval = len(registros)
    reprobadas_count = total_eval - aprobadas_count

    return {
        "nodes": list(nodos.values()),
        "edges": list(relaciones_map.values()),
        "resumen": {
            "correlativo": correlativo,
            "total_evaluaciones": total_eval,
            "aprobadas": aprobadas_count,
            "reprobadas": reprobadas_count,
            "tasa_aprobacion": round(
                (aprobadas_count / total_eval) * 100, 2
            )
            if total_eval
            else 0,
            "materias": sorted(materias_set),
            "carreras": sorted(carreras_set),
        },
    }


def obtener_aspirantes_sugeridos(
    limite: int = 12,
    busqueda: str | None = None,
):
    filtro_busqueda = (busqueda or "").strip()
    consulta = """
    MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:PARA_CARRERA]->(c:Carrera)
    MATCH (e)-[:EVALUA]->(m:Materia)
    OPTIONAL MATCH (e)-[:PROCEDE_DE]->(:Municipio)-[:PERTENECE_A]->(d:Departamento)
    WHERE $busqueda = ""
       OR toLower(a.correlativo) CONTAINS toLower($busqueda)
       OR toLower(c.nombre) CONTAINS toLower($busqueda)
       OR toLower(coalesce(d.nombre, "")) CONTAINS toLower($busqueda)
    WITH
        a.correlativo AS correlativo,
        count(e) AS total_evaluaciones,
        sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas,
        collect(DISTINCT c.nombre)[0..2] AS carreras,
        collect(DISTINCT m.nombre) AS materias,
        head(collect(DISTINCT d.nombre)) AS departamento
    WHERE total_evaluaciones >= 2 OR $busqueda <> ""
    RETURN
        correlativo,
        total_evaluaciones,
        aprobadas,
        carreras,
        materias,
        coalesce(departamento, "SIN DATOS") AS departamento
    ORDER BY total_evaluaciones DESC, aprobadas DESC
    LIMIT $limite
    """
    with driver.session(database=NEO4J_DATABASE) as session:
        return [
            r.data()
            for r in session.run(
                consulta,
                busqueda=filtro_busqueda,
                limite=limite,
            )
        ]


def obtener_opciones_filtros_grafo():
    consulta_materias = """
    MATCH (m:Materia)
    WHERE m.nombre IS NOT NULL AND m.nombre <> "SIN DATOS"
    RETURN DISTINCT m.nombre AS nombre
    ORDER BY nombre
    """
    consulta_carreras = """
    MATCH (c:Carrera)
    WHERE c.nombre IS NOT NULL AND c.nombre <> "SIN DATOS" AND c.nombre <> "NINGUNO"
    RETURN DISTINCT c.nombre AS nombre
    ORDER BY nombre
    LIMIT 50
    """
    consulta_departamentos = """
    MATCH (d:Departamento)
    WHERE d.nombre IS NOT NULL AND d.nombre <> "SIN DATOS"
    RETURN DISTINCT d.nombre AS nombre
    ORDER BY nombre
    """
    consulta_anios = """
    MATCH (p:PeriodoIngreso)
    WHERE p.anio IS NOT NULL
    RETURN DISTINCT p.anio AS anio
    ORDER BY anio DESC
    """
    with driver.session(database=NEO4J_DATABASE) as session:
        materias = [r["nombre"] for r in session.run(consulta_materias)]
        carreras = [r["nombre"] for r in session.run(consulta_carreras)]
        departamentos = [r["nombre"] for r in session.run(consulta_departamentos)]
        anios = [r["anio"] for r in session.run(consulta_anios)]

    return {
        "materias": materias,
        "carreras": carreras,
        "departamentos": departamentos,
        "anios": anios,
    }


def explorar_grafo_general(
    carrera: str | None = None,
    departamento: str | None = None,
    materia: str | None = None,
    anio_ingreso: int | None = None,
    aprobado: bool | None = None,
    limite: int = 30,
):
    consulta = """
    MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:EVALUA]->(m:Materia)
    MATCH (e)-[:PARA_CARRERA]->(c:Carrera)
    OPTIONAL MATCH (e)-[:PROVIENE_DE_TIPO]->(i:InstitucionTipo)
    OPTIONAL MATCH (e)-[:PROCEDE_DE]->(mu:Municipio)-[:PERTENECE_A]->(d:Departamento)
    WHERE ($carrera IS NULL OR toUpper(c.nombre) CONTAINS toUpper($carrera))
      AND ($departamento IS NULL OR toUpper(coalesce(d.nombre, "")) = toUpper($departamento))
      AND ($materia IS NULL OR toUpper(m.nombre) = toUpper($materia))
      AND ($anio_ingreso IS NULL OR e.anio_ingreso = $anio_ingreso)
      AND ($aprobado IS NULL OR e.aprobado = $aprobado)
    RETURN
        a.correlativo AS aspirante,
        elementId(e) AS evaluacion_id,
        e.intento AS intento,
        e.aprobado AS aprobado,
        e.anio_ingreso AS anio_ingreso,
        toString(e.fecha_asignacion) AS fecha,
        m.nombre AS materia,
        c.nombre AS carrera,
        coalesce(i.nombre, "SIN DATOS") AS tipo_institucion,
        coalesce(mu.nombre, "SIN DATOS") AS municipio,
        coalesce(mu.clave, "SIN DATOS") AS clave_municipio,
        coalesce(d.nombre, "SIN DATOS") AS departamento
    LIMIT $limite
    """

    with driver.session(database=NEO4J_DATABASE) as session:
        registros = [
            r.data()
            for r in session.run(
                consulta,
                carrera=carrera.strip() if carrera else None,
                departamento=departamento.strip() if departamento else None,
                materia=materia.strip() if materia else None,
                anio_ingreso=anio_ingreso,
                aprobado=aprobado,
                limite=limite,
            )
        ]

    nodos = {}
    relaciones_map = {}

    def agregar_relacion(source: str, target: str, label: str):
        edge_id = f"{source}->{label}->{target}"
        if edge_id not in relaciones_map:
            relaciones_map[edge_id] = {
                "data": {
                    "id": edge_id,
                    "source": source,
                    "target": target,
                    "label": label,
                }
            }

    aprobadas_count = 0
    materias_set = set()
    carreras_set = set()

    for registro in registros:
        corr = registro["aspirante"]
        aspirante_id = f"aspirante:{corr}"
        evaluacion_id = f"evaluacion:{registro['evaluacion_id']}"
        materia_nombre = registro["materia"]
        carrera_nombre = registro["carrera"]
        materia_id = f"materia:{materia_nombre}"
        carrera_id = f"carrera:{carrera_nombre}"

        es_aprobado = bool(registro["aprobado"])
        if es_aprobado:
            aprobadas_count += 1
        materias_set.add(materia_nombre)
        carreras_set.add(carrera_nombre)

        nodos[aspirante_id] = {
            "data": {
                "id": aspirante_id,
                "label": f"Asp. {corr[:6]}…",
                "correlativo": corr,
                "tipo": "Aspirante",
            }
        }

        nodos[evaluacion_id] = {
            "data": {
                "id": evaluacion_id,
                "label": f"Int. #{registro['intento']} ({registro['anio_ingreso']})",
                "tipo": "Evaluacion",
                "aprobado": es_aprobado,
                "estado": "Aprobado" if es_aprobado else "No aprobado",
                "fecha": (registro["fecha"] or "")[:10],
                "intento": registro["intento"],
                "anio_ingreso": registro["anio_ingreso"],
                "materia": materia_nombre,
                "carrera": carrera_nombre,
                "departamento": registro["departamento"],
            }
        }

        nodos[materia_id] = {
            "data": {
                "id": materia_id,
                "label": materia_nombre,
                "nombre": materia_nombre,
                "tipo": "Materia",
            }
        }

        nodos[carrera_id] = {
            "data": {
                "id": carrera_id,
                "label": carrera_nombre,
                "nombre": carrera_nombre,
                "tipo": "Carrera",
            }
        }

        agregar_relacion(aspirante_id, evaluacion_id, "REALIZO")
        agregar_relacion(evaluacion_id, materia_id, "EVALUA")
        agregar_relacion(evaluacion_id, carrera_id, "PARA_CARRERA")

        depto_nombre = registro.get("departamento")
        if depto_nombre and depto_nombre != "SIN DATOS":
            depto_id = f"departamento:{depto_nombre}"
            nodos[depto_id] = {
                "data": {
                    "id": depto_id,
                    "label": depto_nombre,
                    "nombre": depto_nombre,
                    "tipo": "Departamento",
                }
            }
            agregar_relacion(evaluacion_id, depto_id, "PROCEDE_DE")

    total_eval = len(registros)
    return {
        "nodes": list(nodos.values()),
        "edges": list(relaciones_map.values()),
        "resumen": {
            "total_evaluaciones": total_eval,
            "aprobadas": aprobadas_count,
            "reprobadas": total_eval - aprobadas_count,
            "tasa_aprobacion": round(
                (aprobadas_count / total_eval) * 100, 2
            )
            if total_eval
            else 0,
            "materias": sorted(materias_set),
            "carreras": sorted(carreras_set),
        },
    }


import re as _re

PALABRAS_CYPHER_PROHIBIDAS = _re.compile(
    r"\b(DELETE|DETACH|CREATE|MERGE|SET|REMOVE|DROP|CALL\s+dbms|LOAD\s+CSV)\b",
    _re.IGNORECASE,
)


def _serializar_cypher(valor):
    if isinstance(valor, dict):
        return {str(k): _serializar_cypher(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [_serializar_cypher(x) for x in valor]
    if hasattr(valor, "items") and hasattr(valor, "labels"):
        # Nodo de Neo4j
        datos_nodo = {str(k): _serializar_cypher(v) for k, v in dict(valor).items()}
        datos_nodo["_etiquetas"] = list(valor.labels)
        return datos_nodo
    if hasattr(valor, "items") and hasattr(valor, "type"):
        # Relación de Neo4j
        datos_rel = {str(k): _serializar_cypher(v) for k, v in dict(valor).items()}
        datos_rel["_tipo_relacion"] = valor.type
        return datos_rel
    if isinstance(valor, (int, float, bool, str)) or valor is None:
        return valor
    return str(valor)


def ejecutar_consulta_cypher_personalizada(
    cypher: str,
    parametros: dict | None = None,
    limite: int = 100,
):
    texto = (cypher or "").strip()
    if not texto:
        raise ValueError("La consulta Cypher no puede estar vacía")

    coincidencia = PALABRAS_CYPHER_PROHIBIDAS.search(texto)
    if coincidencia:
        raise ValueError(
            f"Solo se permiten consultas de lectura (operación '{coincidencia.group(0)}' bloqueada por seguridad)"
        )

    if "RETURN" not in texto.upper():
        raise ValueError("La consulta Cypher debe incluir una cláusula RETURN")

    with driver.session(database=NEO4J_DATABASE) as session:
        resultado = session.run(texto, **(parametros or {}))
        filas = []
        for idx, record in enumerate(resultado):
            if idx >= max(1, min(limite, 300)):
                break
            fila_raw = record.data()
            filas.append(_serializar_cypher(fila_raw))
        return filas
