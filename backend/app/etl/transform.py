
from datetime import datetime

EQUIVALENCIAS = {
    "numero_de_fecha_de_evaluaci":
        "numero_de_fecha_de_evaluacion",
    "departamento_institucion_ed":
        "departamento_institucion_educativa",
    "municipio_institucion_":
        "municipio_institucion_educativa",
}


def transformar_registro(fila):
    if not isinstance(fila, dict):
        raise ValueError("El registro leído no tiene formato de fila válido")

    # Normalizar los encabezados y asegurar cadenas limpias (incluso si faltan columnas en la fila)
    datos = {}
    for k, v in fila.items():
        if not isinstance(k, str):
            continue
        clave = EQUIVALENCIAS.get(k.strip().lower(), k.strip().lower())
        if v is None:
            datos[clave] = ""
        elif isinstance(v, str):
            datos[clave] = v.strip()
        else:
            datos[clave] = str(v).strip()

    # Validar campos indispensables
    obligatorios = [
        "correlativo_aspirante",
        "fecha_asignacion",
        "materia",
        "aprobacion",
        "anio_de_ingreso",
        "numero_de_fecha_de_evaluacion",
    ]

    for campo in obligatorios:
        if not datos.get(campo):
            raise ValueError(f"Campo obligatorio vacío: {campo}")

    # Convertir los tipos de datos
    try:
        texto_fecha = datos["fecha_asignacion"]
        fecha = None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                fecha = datetime.strptime(texto_fecha, fmt)
                break
            except ValueError:
                continue
        if fecha is None:
            raise ValueError(
                f"Fecha inválida '{texto_fecha}' (esperado YYYY-MM-DD)"
            )

        anio_ingreso = int(datos["anio_de_ingreso"])

        intento = int(
            datos["numero_de_fecha_de_evaluacion"]
        )

        nacimiento = datos.get("anio_nacimiento") or ""

        anio_nacimiento = (
            int(nacimiento)
            if nacimiento.isdigit()
            else None
        )

    except (ValueError, TypeError, AttributeError) as error:
        raise ValueError(
            f"Error en conversión de datos: {error}"
        )

    if intento < 1:
        raise ValueError("El número de evaluación debe ser positivo")

    if anio_nacimiento is not None:
        if anio_nacimiento > anio_ingreso:
            raise ValueError(
                "El nacimiento es posterior al año de ingreso"
            )

    # Validar aprobación
    aprobacion = datos["aprobacion"].upper()

    if aprobacion not in ("APROBADO", "NO APROBADO"):
        raise ValueError(
            f"Resultado de aprobación desconocido: {aprobacion}"
        )

    # Calcular edad aproximada
    edad = (
        anio_ingreso - anio_nacimiento
        if anio_nacimiento is not None
        else None
    )

    return {
        **datos,
        "fecha_asignacion": fecha,
        "anio_de_ingreso": anio_ingreso,
        "anio_nacimiento": anio_nacimiento,
        "numero_de_fecha_de_evaluacion": intento,
        "aprobacion": aprobacion,
        "aprobado": aprobacion == "APROBADO",
        "edad_aproximada": edad,
    }
