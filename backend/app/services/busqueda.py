
from app.db.mongodb import db


def buscar_evaluaciones(
    correlativo=None,
    materia=None,
    carrera=None,
    sexo=None,
    institucion=None,
    municipio=None,
    departamento=None,
    anio=None,
    aprobado=None,
    pagina=1,
    limite=20
):
    coleccion = db["evaluaciones"]

    filtros = {}

    if correlativo:
        filtros["correlativo_aspirante"] = correlativo.strip()

    if materia:
        filtros["materia"] = materia.strip().upper()

    if carrera:
        filtros["carrera_objetivo"] = carrera.strip().upper()

    if sexo:
        filtros["sexo"] = sexo.strip().upper()

    if institucion:
        filtros["tipo_institucion_educativa"] = institucion.strip().upper()

    if municipio:
        filtros["municipio_institucion_educativa"] = municipio.strip().upper()

    if departamento:
        filtros["departamento_institucion_educativa"] = departamento.strip().upper()

    if anio is not None:
        filtros["anio_de_ingreso"] = anio

    if aprobado is not None:
        filtros["aprobado"] = aprobado

    total = coleccion.count_documents(filtros)

    salto = (pagina - 1) * limite

    cursor = (
        coleccion.find(filtros, {"_id": 0})
        .sort("_id", 1)
        .skip(salto)
        .limit(limite)
    )

    resultados = list(cursor)

    return {
        "total": total,
        "pagina": pagina,
        "limite": limite,
        "total_paginas": (total + limite - 1) // limite,
        "resultados": resultados
    }
