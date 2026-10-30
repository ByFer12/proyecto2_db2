
import re
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
        texto_corr = correlativo.strip()
        if len(texto_corr) == 32:
            filtros["correlativo_aspirante"] = texto_corr
        else:
            filtros["correlativo_aspirante"] = {
                "$regex": re.escape(texto_corr),
                "$options": "i"
            }

    if materia:
        filtros["materia"] = materia.strip().upper()

    if carrera:
        filtros["carrera_objetivo"] = {
            "$regex": re.escape(carrera.strip()),
            "$options": "i"
        }

    if sexo:
        filtros["sexo"] = sexo.strip().upper()

    if institucion:
        inst_limpia = institucion.strip().upper()
        if inst_limpia in ("COOPERATIVA", "POR COOPERATIVA"):
            filtros["tipo_institucion_educativa"] = {
                "$in": ["COOPERATIVA", "POR COOPERATIVA"]
            }
        else:
            filtros["tipo_institucion_educativa"] = inst_limpia

    if municipio:
        filtros["municipio_institucion_educativa"] = {
            "$regex": re.escape(municipio.strip()),
            "$options": "i"
        }

    if departamento:
        filtros["departamento_institucion_educativa"] = {
            "$regex": re.escape(departamento.strip()),
            "$options": "i"
        }

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
