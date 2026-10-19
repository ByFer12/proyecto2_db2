
from app.db.mongodb import db


def aspirantes_por_institucion():
    pipeline = [
        {
            "$group": {
                "_id": {
                    "institucion": "$tipo_institucion_educativa",
                    "aspirante": "$correlativo_aspirante"
                }
            }
        },
        {
            "$group": {
                "_id": "$_id.institucion",
                "total_aspirantes": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "tipo_institucion": "$_id",
                "total_aspirantes": 1
            }
        },
        {
            "$sort": {
                "total_aspirantes": -1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))

def aprobados_por_materia():
    pipeline = [
        {
            "$match": {
                "aprobado": True
            }
        },
        {
            "$group": {
                "_id": "$materia",
                "total_aprobados": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "materia": "$_id",
                "total_aprobados": 1
            }
        },
        {
            "$sort": {
                "total_aprobados": -1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def aprobados_por_carrera_anio():
    pipeline = [
        # 1. Seleccionar evaluaciones aprobadas
        {
            "$match": {
                "aprobado": True
            }
        },

        # 2. Eliminar repeticiones del aspirante
        # dentro de la misma carrera y año
        {
            "$group": {
                "_id": {
                    "carrera": "$carrera_objetivo",
                    "anio": "$anio_de_ingreso",
                    "aspirante": "$correlativo_aspirante"
                }
            }
        },

        # 3. Contar aspirantes por carrera y año
        {
            "$group": {
                "_id": {
                    "carrera": "$_id.carrera",
                    "anio": "$_id.anio"
                },
                "total_aspirantes_aprobados": {
                    "$sum": 1
                }
            }
        },

        # 4. Preparar los campos de respuesta
        {
            "$project": {
                "_id": 0,
                "carrera": "$_id.carrera",
                "anio_ingreso": "$_id.anio",
                "total_aspirantes_aprobados": 1
            }
        },

        # 5. Ordenar cronológicamente
        {
            "$sort": {
                "anio_ingreso": 1,
                "total_aspirantes_aprobados": -1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))



def porcentaje_aprobacion_materia():
    pipeline = [
        {
            "$group": {
                "_id": "$materia",
                "total_evaluaciones": {"$sum": 1},
                "aprobadas": {
                    "$sum": {
                        "$cond": [
                            "$aprobado",
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "materia": "$_id",
                "total_evaluaciones": 1,
                "aprobadas": 1,
                "porcentaje_aprobacion": {
                    "$round": [
                        {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$aprobadas",
                                        "$total_evaluaciones"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },
        {
            "$sort": {
                "total_evaluaciones": -1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def promedio_edad_carrera():
    pipeline = [
        # 1. Seleccionar edades disponibles y plausibles
        {
            "$match": {
                "edad_aproximada": {
                    "$gte": 10,
                    "$lte": 100
                }
            }
        },

        # 2. Evitar contar repetidamente al mismo
        # aspirante dentro de una carrera y año
        {
            "$group": {
                "_id": {
                    "aspirante": "$correlativo_aspirante",
                    "carrera": "$carrera_objetivo",
                    "anio": "$anio_de_ingreso"
                },
                "edad": {"$first": "$edad_aproximada"}
            }
        },

        # 3. Calcular el promedio por carrera
        {
            "$group": {
                "_id": "$_id.carrera",
                "promedio_edad": {
                    "$avg": "$edad"
                },
                "total_aspirantes_periodo": {
                    "$sum": 1
                }
            }
        },

        # 4. Preparar la respuesta
        {
            "$project": {
                "_id": 0,
                "carrera": "$_id",
                "promedio_edad": {
                    "$round": ["$promedio_edad", 2]
                },
                "total_aspirantes_periodo": 1
            }
        },

        # 5. Ordenar por carrera
        {
            "$sort": {
                "carrera": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def generar_resumen_carrera():
    pipeline = [
        {
            "$group": {
                "_id": "$carrera_objetivo",
                "total_evaluaciones": {"$sum": 1},
                "evaluaciones_aprobadas": {
                    "$sum": {
                        "$cond": [
                            "$aprobado", 1, 0
                        ]
                    }
                },
                "aspirantes": {
                    "$addToSet": "$correlativo_aspirante"
                }
            }
        },
        {
            "$project": {
                "total_evaluaciones": 1,
                "evaluaciones_aprobadas": 1,
                "total_aspirantes": {
                    "$size": "$aspirantes"
                },
                "porcentaje_aprobacion": {
                    "$round": [
                        {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$evaluaciones_aprobadas",
                                        "$total_evaluaciones"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },
        {
            "$merge": {
                "into": "resumen_carrera",
                "on": "_id",
                "whenMatched": "replace",
                "whenNotMatched": "insert"
            }
        }
    ]

    # Ejecutar la agregación y consumir el cursor.
    list(db["evaluaciones"].aggregate(pipeline))

    return {
        "mensaje": "Resumen por carrera generado",
        "total_carreras": db["resumen_carrera"].count_documents({})
    }


def promedio_edad_aprobados_carrera_institucion():
    pipeline = [
        {
            "$match": {
                "aprobado": True,
                "edad_aproximada": {
                    "$gte": 10,
                    "$lte": 100
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "aspirante": "$correlativo_aspirante",
                    "carrera": "$carrera_objetivo",
                    "institucion": "$tipo_institucion_educativa",
                    "anio": "$anio_de_ingreso"
                },
                "edad": {
                    "$first": "$edad_aproximada"
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "carrera": "$_id.carrera",
                    "institucion": "$_id.institucion"
                },
                "promedio_edad": {
                    "$avg": "$edad"
                },
                "total_aspirantes_periodo": {
                    "$sum": 1
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "carrera": "$_id.carrera",
                "tipo_institucion": "$_id.institucion",
                "promedio_edad": {
                    "$round": ["$promedio_edad", 2]
                },
                "total_aspirantes_periodo": 1
            }
        },
        {
            "$sort": {
                "carrera": 1,
                "tipo_institucion": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def aprobados_por_municipio_carrera():
    pipeline = [
        {
            "$match": {
                "aprobado": True
            }
        },
        {
            "$group": {
                "_id": {
                    "departamento": "$departamento_institucion_educativa",
                    "municipio": "$municipio_institucion_educativa",
                    "carrera": "$carrera_objetivo"
                },
                "total_aprobados": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "departamento": "$_id.departamento",
                "municipio": "$_id.municipio",
                "carrera": "$_id.carrera",
                "total_aprobados": 1
            }
        },
        {
            "$sort": {
                "total_aprobados": -1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def evaluaciones_mensuales_instituciones_publicas():
    pipeline = [
        # 1. Seleccionar instituciones públicas
        {
            "$match": {
                "tipo_institucion_educativa": "PUBLICO",
                "fecha_asignacion": {"$type": "date"}
            }
        },

        # 2. Agrupar por año, mes y materia
        {
            "$group": {
                "_id": {
                    "anio": {
                        "$year": "$fecha_asignacion"
                    },
                    "mes": {
                        "$month": "$fecha_asignacion"
                    },
                    "materia": "$materia"
                },
                "total_evaluaciones": {"$sum": 1}
            }
        },

        # 3. Preparar los campos de respuesta
        {
            "$project": {
                "_id": 0,
                "anio": "$_id.anio",
                "mes": "$_id.mes",
                "materia": "$_id.materia",
                "total_evaluaciones": 1
            }
        },

        # 4. Ordenar cronológicamente
        {
            "$sort": {
                "anio": 1,
                "mes": 1,
                "materia": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def top_carreras_aspirantes_jovenes():
    pipeline = [
        # 1. Seleccionar edades entre 16 y 18 años
        {
            "$match": {
                "edad_aproximada": {
                    "$gte": 16,
                    "$lte": 18
                },
                "carrera_objetivo": {
                    "$nin": ["NINGUNO", "SIN DATOS", ""]
                }
            }
        },

        # 2. Evitar contar varias veces al mismo
        # aspirante dentro de una carrera
        {
            "$group": {
                "_id": {
                    "carrera": "$carrera_objetivo",
                    "aspirante": "$correlativo_aspirante"
                }
            }
        },

        # 3. Contar aspirantes únicos por carrera
        {
            "$group": {
                "_id": "$_id.carrera",
                "total_aspirantes": {
                    "$sum": 1
                }
            }
        },

        # 4. Preparar los campos del resultado
        {
            "$project": {
                "_id": 0,
                "carrera": "$_id",
                "total_aspirantes": 1
            }
        },

        # 5. Ordenar de mayor a menor
        {
            "$sort": {
                "total_aspirantes": -1,
                "carrera": 1
            }
        },

        # 6. Obtener solamente las cinco primeras
        {
            "$limit": 5
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def historial_desempeno_aspirante(correlativo: str):
    pipeline = [
        {
            "$match": {
                "correlativo_aspirante": correlativo
            }
        },
        {
            "$project": {
                "_id": 0,
                "correlativo_aspirante": 1,
                "fecha_asignacion": 1,
                "materia": 1,
                "numero_de_fecha_de_evaluacion": 1,
                "anio_de_ingreso": 1,
                "aprobacion": 1,
                "aprobado": 1,
                "carrera_objetivo": 1
            }
        },
        {
            "$sort": {
                "anio_de_ingreso": 1,
                "fecha_asignacion": 1,
                "materia": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def distribucion_sexo_institucion():
    pipeline = [
        # 1. Evitar repetir aspirantes dentro
        # de la misma combinación
        {
            "$group": {
                "_id": {
                    "aspirante": "$correlativo_aspirante",
                    "sexo": "$sexo",
                    "institucion": "$tipo_institucion_educativa"
                }
            }
        },

        # 2. Contar aspirantes por sexo e institución
        {
            "$group": {
                "_id": {
                    "sexo": "$_id.sexo",
                    "institucion": "$_id.institucion"
                },
                "total_aspirantes": {"$sum": 1}
            }
        },

        # 3. Preparar respuesta
        {
            "$project": {
                "_id": 0,
                "sexo": "$_id.sexo",
                "tipo_institucion": "$_id.institucion",
                "total_aspirantes": 1
            }
        },

        # 4. Ordenar resultados
        {
            "$sort": {
                "tipo_institucion": 1,
                "sexo": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def tasa_aprobacion_por_edad():
    pipeline = [
        # 1. Seleccionar edades disponibles y plausibles
        {
            "$match": {
                "edad_aproximada": {
                    "$gte": 10,
                    "$lte": 100
                }
            }
        },

        # 2. Agrupar evaluaciones por edad
        {
            "$group": {
                "_id": "$edad_aproximada",
                "total_evaluaciones": {
                    "$sum": 1
                },
                "evaluaciones_aprobadas": {
                    "$sum": {
                        "$cond": [
                            "$aprobado", 1, 0
                        ]
                    }
                }
            }
        },

        # 3. Calcular porcentaje
        {
            "$project": {
                "_id": 0,
                "edad": "$_id",
                "total_evaluaciones": 1,
                "evaluaciones_aprobadas": 1,
                "porcentaje_aprobacion": {
                    "$round": [
                        {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$evaluaciones_aprobadas",
                                        "$total_evaluaciones"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },

        # 4. Ordenar por edad
        {
            "$sort": {
                "edad": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))

def promedio_intentos_por_materia():
    pipeline = [
        # 1. Seleccionar evaluaciones con oportunidad válida
        {
            "$match": {
                "numero_de_fecha_de_evaluacion": {
                    "$gte": 1
                }
            }
        },

        # 2. Identificar oportunidades diferentes
        # por aspirante, materia y año
        {
            "$group": {
                "_id": {
                    "aspirante": "$correlativo_aspirante",
                    "materia": "$materia",
                    "anio": "$anio_de_ingreso"
                },
                "oportunidades": {
                    "$addToSet": "$numero_de_fecha_de_evaluacion"
                }
            }
        },

        # 3. Contar oportunidades registradas
        {
            "$project": {
                "materia": "$_id.materia",
                "cantidad_intentos": {
                    "$size": "$oportunidades"
                }
            }
        },

        # 4. Calcular promedio por materia
        {
            "$group": {
                "_id": "$materia",
                "promedio_intentos": {
                    "$avg": "$cantidad_intentos"
                },
                "total_aspirantes_periodo": {
                    "$sum": 1
                }
            }
        },

        # 5. Preparar respuesta
        {
            "$project": {
                "_id": 0,
                "materia": "$_id",
                "promedio_intentos": {
                    "$round": ["$promedio_intentos", 2]
                },
                "total_aspirantes_periodo": 1
            }
        },

        {
            "$sort": {
                "materia": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def historial_completo_aspirante(correlativo: str):
    pipeline = [
        {
            "$match": {
                "correlativo_aspirante": correlativo
            }
        },
        {
            "$project": {
                "_id": 0,
                "id_registro": 1,
                "correlativo_aspirante": 1,
                "fecha_asignacion": 1,
                "sexo": 1,
                "anio_nacimiento": 1,
                "edad_aproximada": 1,
                "materia": 1,
                "numero_de_fecha_de_evaluacion": 1,
                "anio_de_ingreso": 1,
                "aprobacion": 1,
                "aprobado": 1,
                "carrera_objetivo": 1,
                "departamento_institucion_educativa": 1,
                "municipio_institucion_educativa": 1,
                "tipo_institucion_educativa": 1,
                "archivo_origen": 1,
                "fila_origen": 1
            }
        },
        {
            "$sort": {
                "anio_de_ingreso": 1,
                "fecha_asignacion": 1,
                "numero_de_fecha_de_evaluacion": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def carreras_reprobados_primer_intento():
    pipeline = [
        {
            "$match": {
                "numero_de_fecha_de_evaluacion": 1,
                "aprobado": False,
                "carrera_objetivo": {
                    "$nin": ["NINGUNO", "SIN DATOS", "", None]
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "aspirante": "$correlativo_aspirante",
                    "carrera": "$carrera_objetivo"
                }
            }
        },
        {
            "$group": {
                "_id": "$_id.carrera",
                "total_aspirantes_reprobados": {
                    "$sum": 1
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "carrera": "$_id",
                "total_aspirantes_reprobados": 1
            }
        },
        {
            "$sort": {
                "total_aspirantes_reprobados": -1,
                "carrera": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def top_municipios_aspirantes():
    pipeline = [
        # 1. Excluir procedencias sin información
        {
            "$match": {
                "municipio_institucion_educativa": {
                    "$nin": ["", "SIN DATOS", None]
                },
                "departamento_institucion_educativa": {
                    "$nin": ["", "SIN DATOS", None]
                }
            }
        },

        # 2. Identificar aspirantes únicos por municipio
        {
            "$group": {
                "_id": {
                    "aspirante": "$correlativo_aspirante",
                    "municipio": "$municipio_institucion_educativa",
                    "departamento": "$departamento_institucion_educativa"
                }
            }
        },

        # 3. Contar aspirantes por municipio
        {
            "$group": {
                "_id": {
                    "municipio": "$_id.municipio",
                    "departamento": "$_id.departamento"
                },
                "total_aspirantes": {"$sum": 1}
            }
        },

        # 4. Preparar campos de salida
        {
            "$project": {
                "_id": 0,
                "municipio": "$_id.municipio",
                "departamento": "$_id.departamento",
                "total_aspirantes": 1
            }
        },

        # 5. Ordenar y seleccionar los cinco primeros
        {
            "$sort": {
                "total_aspirantes": -1,
                "departamento": 1,
                "municipio": 1
            }
        },
        {
            "$limit": 5
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def tasa_aprobacion_institucion():
    pipeline = [
        # 1. Agrupar evaluaciones por institución
        {
            "$group": {
                "_id": "$tipo_institucion_educativa",
                "total_evaluaciones": {
                    "$sum": 1
                },
                "evaluaciones_aprobadas": {
                    "$sum": {
                        "$cond": [
                            "$aprobado",
                            1,
                            0
                        ]
                    }
                }
            }
        },

        # 2. Calcular el porcentaje de aprobación
        {
            "$project": {
                "_id": 0,
                "tipo_institucion": "$_id",
                "total_evaluaciones": 1,
                "evaluaciones_aprobadas": 1,
                "porcentaje_aprobacion": {
                    "$round": [
                        {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$evaluaciones_aprobadas",
                                        "$total_evaluaciones"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },

        # 3. Ordenar por porcentaje descendente
        {
            "$sort": {
                "porcentaje_aprobacion": -1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def carreras_demandadas_departamento():
    pipeline = [
        # 1. Excluir procedencias y carreras desconocidas
        {
            "$match": {
                "departamento_institucion_educativa": {
                    "$nin": ["SIN DATOS", "", None]
                },
                "carrera_objetivo": {
                    "$nin": ["NINGUNO", "SIN DATOS", "", None]
                }
            }
        },

        # 2. Evitar contar repetidamente al aspirante
        # en la misma combinación departamento-carrera
        {
            "$group": {
                "_id": {
                    "departamento": "$departamento_institucion_educativa",
                    "carrera": "$carrera_objetivo",
                    "aspirante": "$correlativo_aspirante"
                }
            }
        },

        # 3. Contar aspirantes por carrera y departamento
        {
            "$group": {
                "_id": {
                    "departamento": "$_id.departamento",
                    "carrera": "$_id.carrera"
                },
                "total_aspirantes": {"$sum": 1}
            }
        },

        # 4. Ordenar las carreras por demanda
        {
            "$sort": {
                "_id.departamento": 1,
                "total_aspirantes": -1,
                "_id.carrera": 1
            }
        },

        # 5. Construir un ranking por departamento
        {
            "$group": {
                "_id": "$_id.departamento",
                "carreras": {
                    "$push": {
                        "carrera": "$_id.carrera",
                        "aspirantes": "$total_aspirantes"
                    }
                }
            }
        },

        # 6. Elegir la carrera más demandada
        {
            "$project": {
                "_id": 0,
                "departamento": "$_id",
                "carrera_mas_demandada": {
                    "$arrayElemAt": ["$carreras.carrera", 0]
                },
                "total_aspirantes": {
                    "$arrayElemAt": ["$carreras.aspirantes", 0]
                }
            }
        },

        # 7. Ordenar el resultado
        {
            "$sort": {
                "total_aspirantes": -1,
                "departamento": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))


def evolucion_aprobacion_anual():
    pipeline = [
        # 1. Agrupar todas las evaluaciones por año de ingreso
        {
            "$group": {
                "_id": "$anio_de_ingreso",
                "total_evaluaciones": {
                    "$sum": 1
                },
                "aprobadas": {
                    "$sum": {
                        "$cond": ["$aprobado", 1, 0]
                    }
                },
                "no_aprobadas": {
                    "$sum": {
                        "$cond": ["$aprobado", 0, 1]
                    }
                }
            }
        },

        # 2. Calcular porcentajes
        {
            "$project": {
                "_id": 0,
                "anio_ingreso": "$_id",
                "total_evaluaciones": 1,
                "aprobadas": 1,
                "no_aprobadas": 1,
                "porcentaje_aprobacion": {
                    "$round": [
                        {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$aprobadas",
                                        "$total_evaluaciones"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                },
                "porcentaje_no_aprobacion": {
                    "$round": [
                        {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$no_aprobadas",
                                        "$total_evaluaciones"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },

        # 3. Ordenar los resultados cronológicamente
        {
            "$sort": {
                "anio_ingreso": 1
            }
        }
    ]

    return list(db["evaluaciones"].aggregate(pipeline))
