import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";
import type { Core, ElementDefinition } from "cytoscape";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Compass,
  Filter,
  Search,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Layers,
} from "lucide-react";

export interface GrafoData {
  nodes: ElementDefinition[];
  edges: ElementDefinition[];
}

interface Props {
  grafo: GrafoData;
  onSeleccionarAspirante?: (correlativo: string) => void;
}

type LayoutType =
  | "cose"
  | "concentric"
  | "breadthfirst"
  | "circle"
  | "grid";

const COLORES_TIPO: Record<
  string,
  { bg: string; border: string; nombre: string; badge: string }
> = {
  Aspirante: {
    bg: "#2563eb",
    border: "#93c5fd",
    nombre: "Aspirante",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
  EvaluacionAprobada: {
    bg: "#059669",
    border: "#6ee7b7",
    nombre: "Evaluación (Aprobada)",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  EvaluacionReprobada: {
    bg: "#e11d48",
    border: "#fda4af",
    nombre: "Evaluación (No aprobada)",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
  Materia: {
    bg: "#7c3aed",
    border: "#c4b5fd",
    nombre: "Materia",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  },
  Carrera: {
    bg: "#d97706",
    border: "#fcd34d",
    nombre: "Carrera",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  Departamento: {
    bg: "#0891b2",
    border: "#67e8f9",
    nombre: "Departamento",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  },
  Municipio: {
    bg: "#0d9488",
    border: "#5eead4",
    nombre: "Municipio",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  },
  InstitucionTipo: {
    bg: "#4f46e5",
    border: "#a5b4fc",
    nombre: "Tipo Institución",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  },
  PeriodoIngreso: {
    bg: "#475569",
    border: "#cbd5e1",
    nombre: "Período Ingreso",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  },
};

export default function GrafoInteractivo({
  grafo,
  onSeleccionarAspirante,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [layoutActivo, setLayoutActivo] =
    useState<LayoutType>("cose");
  const [mostrarEtiquetasAristas, setMostrarEtiquetasAristas] =
    useState(true);
  const [busquedaNodo, setBusquedaNodo] = useState("");
  const [filtroEstadoEval, setFiltroEstadoEval] = useState<
    "todas" | "aprobadas" | "reprobadas"
  >("todas");
  const [tiposOcultos, setTiposOcultos] = useState<
    Record<string, boolean>
  >({});
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const [seleccionado, setSeleccionado] = useState<{
    esArista: boolean;
    datos: Record<string, unknown>;
    vecinos: string[];
  } | null>(null);

  // Calcular conteos por tipo de nodo presentes en el grafo
  const conteoPorTipo = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const n of grafo.nodes) {
      const tipo = String(n.data?.tipo ?? "Otro");
      conteo[tipo] = (conteo[tipo] ?? 0) + 1;
    }
    return conteo;
  }, [grafo.nodes]);

  // Filtrar elementos en memoria según filtros visuales activos
  const elementosFiltrados = useMemo(() => {
    const nodosVisiblesIds = new Set<string>();

    const nodos = grafo.nodes.filter((n) => {
      const data = n.data ?? {};
      const tipo = String(data.tipo ?? "");
      const id = String(data.id ?? "");

      if (tiposOcultos[tipo]) {
        return false;
      }

      if (tipo === "Evaluacion") {
        if (
          filtroEstadoEval === "aprobadas" &&
          data.aprobado !== true
        ) {
          return false;
        }
        if (
          filtroEstadoEval === "reprobadas" &&
          data.aprobado !== false
        ) {
          return false;
        }
      }

      nodosVisiblesIds.add(id);
      return true;
    });

    const aristas = grafo.edges.filter((e) => {
      const source = String(e.data?.source ?? "");
      const target = String(e.data?.target ?? "");
      return (
        nodosVisiblesIds.has(source) &&
        nodosVisiblesIds.has(target)
      );
    });

    return { nodos, aristas };
  }, [grafo, tiposOcultos, filtroEstadoEval]);

  function obtenerConfigLayout(nombre: LayoutType) {
    if (nombre === "cose") {
      return {
        name: "cose",
        animate: true,
        animationDuration: 450,
        padding: 55,
        nodeRepulsion: () => 280000,
        idealEdgeLength: () => 110,
      };
    }
    if (nombre === "concentric") {
      return {
        name: "concentric",
        animate: true,
        animationDuration: 450,
        padding: 50,
        minNodeSpacing: 45,
        concentric: (node: cytoscape.NodeSingular) => {
          const t = node.data("tipo");
          if (t === "Aspirante") return 4;
          if (t === "Evaluacion") return 3;
          if (t === "Materia" || t === "Carrera") return 2;
          return 1;
        },
        levelWidth: () => 1,
      };
    }
    if (nombre === "breadthfirst") {
      return {
        name: "breadthfirst",
        directed: true,
        animate: true,
        animationDuration: 450,
        padding: 50,
        spacingFactor: 1.25,
      };
    }
    return {
      name: nombre,
      animate: true,
      animationDuration: 450,
      padding: 50,
    };
  }

  useEffect(() => {
    if (!contenedorRef.current) return;

    setSeleccionado(null);

    const cy = cytoscape({
      container: contenedorRef.current,
      elements: [
        ...elementosFiltrados.nodos,
        ...elementosFiltrados.aristas,
      ],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#64748b",
            color: "#f8fafc",
            "font-size": "11px",
            "font-weight": 600,
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "92px",
            width: 82,
            height: 82,
            "border-width": 2.5,
            "border-color": "#cbd5e1",
            "overlay-padding": "6px",
            "transition-property":
              "background-color, border-color, border-width, opacity, width, height",
            "transition-duration": 200,
          },
        },
        {
          selector: 'node[tipo = "Aspirante"]',
          style: {
            "background-color": COLORES_TIPO.Aspirante.bg,
            "border-color": COLORES_TIPO.Aspirante.border,
            shape: "hexagon",
            width: 102,
            height: 102,
            "font-size": "12px",
          },
        },
        {
          selector: 'node[tipo = "Evaluacion"]',
          style: {
            "background-color": (ele) =>
              ele.data("aprobado")
                ? COLORES_TIPO.EvaluacionAprobada.bg
                : COLORES_TIPO.EvaluacionReprobada.bg,
            "border-color": (ele) =>
              ele.data("aprobado")
                ? COLORES_TIPO.EvaluacionAprobada.border
                : COLORES_TIPO.EvaluacionReprobada.border,
            shape: "ellipse",
            width: 78,
            height: 78,
          },
        },
        {
          selector: 'node[tipo = "Materia"]',
          style: {
            "background-color": COLORES_TIPO.Materia.bg,
            "border-color": COLORES_TIPO.Materia.border,
            shape: "round-rectangle",
            width: 96,
            height: 60,
          },
        },
        {
          selector: 'node[tipo = "Carrera"]',
          style: {
            "background-color": COLORES_TIPO.Carrera.bg,
            "border-color": COLORES_TIPO.Carrera.border,
            shape: "round-diamond",
            width: 104,
            height: 88,
          },
        },
        {
          selector: 'node[tipo = "Departamento"]',
          style: {
            "background-color": COLORES_TIPO.Departamento.bg,
            "border-color": COLORES_TIPO.Departamento.border,
            shape: "round-tag",
            width: 92,
            height: 62,
          },
        },
        {
          selector: 'node[tipo = "Municipio"]',
          style: {
            "background-color": COLORES_TIPO.Municipio.bg,
            "border-color": COLORES_TIPO.Municipio.border,
            shape: "round-rectangle",
            width: 90,
            height: 56,
          },
        },
        {
          selector: 'node[tipo = "InstitucionTipo"]',
          style: {
            "background-color": COLORES_TIPO.InstitucionTipo.bg,
            "border-color": COLORES_TIPO.InstitucionTipo.border,
            shape: "barrel",
            width: 82,
            height: 64,
          },
        },
        {
          selector: 'node[tipo = "PeriodoIngreso"]',
          style: {
            "background-color": COLORES_TIPO.PeriodoIngreso.bg,
            "border-color": COLORES_TIPO.PeriodoIngreso.border,
            shape: "octagon",
            width: 72,
            height: 72,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#475569",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: mostrarEtiquetasAristas ? "data(label)" : "",
            color: "#94a3b8",
            "font-size": "8.5px",
            "text-rotation": "autorotate",
            "text-background-color": "#020617",
            "text-background-opacity": 0.75,
            "text-background-padding": "2px",
            "transition-property": "line-color, width, opacity",
            "transition-duration": 200,
          },
        },
        {
          selector: ".atenuado",
          style: {
            opacity: 0.18,
          },
        },
        {
          selector: ".resaltado",
          style: {
            "border-color": "#38bdf8",
            "border-width": 4.5,
          },
        },
        {
          selector: "edge.resaltado",
          style: {
            "line-color": "#38bdf8",
            "target-arrow-color": "#38bdf8",
            width: 3.2,
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#facc15",
            "border-width": 5,
          },
        },
      ],
      layout: obtenerConfigLayout(layoutActivo),
      minZoom: 0.12,
      maxZoom: 3.5,
      wheelSensitivity: 0.2,
    });

    cyRef.current = cy;

    cy.on("tap", "node", (evento) => {
      const nodo = evento.target;
      cy.elements().removeClass("atenuado resaltado");

      const vecindad = nodo.closedNeighborhood();
      cy.elements().not(vecindad).addClass("atenuado");
      vecindad.addClass("resaltado");

      const nombresVecinos = nodo
        .neighborhood("node")
        .map((n: cytoscape.NodeSingular) =>
          String(n.data("label") ?? n.id()).replace(/\n/g, " ")
        );

      setSeleccionado({
        esArista: false,
        datos: { ...nodo.data() },
        vecinos: nombresVecinos,
      });
    });

    cy.on("tap", "edge", (evento) => {
      const arista = evento.target;
      cy.elements().removeClass("atenuado resaltado");
      const conectados = arista
        .connectedNodes()
        .union(arista);
      cy.elements().not(conectados).addClass("atenuado");
      conectados.addClass("resaltado");

      setSeleccionado({
        esArista: true,
        datos: { ...arista.data() },
        vecinos: [],
      });
    });

    cy.on("tap", (evento) => {
      if (evento.target === cy) {
        cy.elements().removeClass("atenuado resaltado");
        setSeleccionado(null);
      }
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elementosFiltrados]);

  // Actualizar visibilidad de etiquetas de relaciones en caliente
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style()
      .selector("edge")
      .style(
        "label",
        mostrarEtiquetasAristas ? "data(label)" : ""
      )
      .update();
  }, [mostrarEtiquetasAristas]);

  // Resaltar búsqueda de nodos en vivo
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const texto = busquedaNodo.trim().toLowerCase();
    cy.elements().removeClass("atenuado resaltado");

    if (!texto) return;

    const coincidentes = cy.nodes().filter((n) => {
      const label = String(n.data("label") ?? "").toLowerCase();
      const corr = String(
        n.data("correlativo") ?? ""
      ).toLowerCase();
      const carrera = String(
        n.data("carrera") ?? ""
      ).toLowerCase();
      const materia = String(
        n.data("materia") ?? ""
      ).toLowerCase();
      return (
        label.includes(texto) ||
        corr.includes(texto) ||
        carrera.includes(texto) ||
        materia.includes(texto)
      );
    });

    if (coincidentes.length > 0) {
      const conVecinos = coincidentes.closedNeighborhood();
      cy.elements().not(conVecinos).addClass("atenuado");
      coincidentes.addClass("resaltado");
    }
  }, [busquedaNodo]);

  function cambiarLayout(nuevo: LayoutType) {
    setLayoutActivo(nuevo);
    const cy = cyRef.current;
    if (!cy) return;
    cy.layout(obtenerConfigLayout(nuevo)).run();
  }

  function exportarPNG() {
    const cy = cyRef.current;
    if (!cy) return;
    const dataUrl = cy.png({
      full: true,
      scale: 2,
      bg: "#020617",
    });
    const enlace = document.createElement("a");
    enlace.href = dataUrl;
    enlace.download = `grafo-neo4j-${Date.now()}.png`;
    enlace.click();
  }

  function alternarTipoNodo(tipo: string) {
    setTiposOcultos((prev) => ({
      ...prev,
      [tipo]: !prev[tipo],
    }));
  }

  function alternarPantallaCompleta() {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.().catch(() => {
        setPantallaCompleta((p) => !p);
      });
      setPantallaCompleta(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setPantallaCompleta(false);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={`space-y-4 ${
        pantallaCompleta
          ? "bg-slate-950 p-6 overflow-y-auto h-screen"
          : ""
      }`}
    >
      {/* Barra de controles de visualización y filtros sobre el grafo */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Selector de Layout */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Layers size={14} className="text-sky-400" />
              Disposición:
            </span>
            {(
              [
                ["cose", "Fuerza dirigida"],
                ["concentric", "Concéntrico"],
                ["breadthfirst", "Jerárquico"],
                ["circle", "Circular"],
                ["grid", "Cuadrícula"],
              ] as [LayoutType, string][]
            ).map(([id, etiqueta]) => (
              <button
                key={id}
                type="button"
                onClick={() => cambiarLayout(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  layoutActivo === id
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {/* Filtro rápido de Evaluaciones en el lienzo */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter size={14} className="text-emerald-400" />
              Evaluaciones:
            </span>
            {(
              [
                ["todas", "Todas"],
                ["aprobadas", "Solo Aprobadas"],
                ["reprobadas", "Solo No Aprobadas"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltroEstadoEval(valor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroEstadoEval === valor
                    ? valor === "aprobadas"
                      ? "bg-emerald-600 text-white"
                      : valor === "reprobadas"
                        ? "bg-rose-600 text-white"
                        : "bg-sky-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador dentro del grafo + Filtros por tipo de nodo */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">
              Capas de nodos (clic para mostrar/ocultar):
            </span>
            {Object.entries(conteoPorTipo).map(
              ([tipo, cantidad]) => {
                const oculto = !!tiposOcultos[tipo];
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => alternarTipoNodo(tipo)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      oculto
                        ? "bg-slate-900 text-slate-500 border-slate-800 line-through opacity-60"
                        : "bg-slate-800 text-slate-200 border-slate-700 hover:border-sky-500/50"
                    }`}
                  >
                    <span>{tipo}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] text-sky-400">
                      {cantidad}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <div className="relative min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={busquedaNodo}
              onChange={(e) => setBusquedaNodo(e.target.value)}
              placeholder="Resaltar nodo en el lienzo..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Leyenda visual */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block border border-blue-300" />
            Aspirante
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-emerald-300" />
            Evaluación Aprobada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-rose-300" />
            Evaluación No Aprobada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-violet-600 inline-block border border-violet-300" />
            Materia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rotate-45 bg-amber-600 inline-block border border-amber-300" />
            Carrera
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-600 inline-block border border-teal-300" />
            Municipio / Depto.
          </span>
        </div>

        <span className="text-slate-400">
          Mostrando {elementosFiltrados.nodos.length} nodos y{" "}
          {elementosFiltrados.aristas.length} relaciones
        </span>
      </div>

      {/* Lienzo + Panel lateral de inspección */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div
          className={`relative ${
            seleccionado ? "lg:col-span-8" : "lg:col-span-12"
          }`}
        >
          <div
            ref={contenedorRef}
            className="w-full h-[580px] bg-slate-950 border border-slate-800 rounded-2xl shadow-inner"
          />

          {/* Barra de herramientas flotante sobre el lienzo */}
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-lg">
            <button
              type="button"
              onClick={() => cyRef.current?.fit(undefined, 45)}
              title="Centrar y ajustar grafo"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              <Compass size={14} className="text-sky-400" />
              Centrar
            </button>

            <button
              type="button"
              onClick={() =>
                cyRef.current?.zoom({
                  level: Math.min(cyRef.current.zoom() * 1.25, 3.5),
                  renderedPosition: {
                    x: cyRef.current.width() / 2,
                    y: cyRef.current.height() / 2,
                  },
                })
              }
              title="Acercar"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
            >
              <ZoomIn size={15} />
            </button>

            <button
              type="button"
              onClick={() =>
                cyRef.current?.zoom({
                  level: Math.max(cyRef.current.zoom() / 1.25, 0.12),
                  renderedPosition: {
                    x: cyRef.current.width() / 2,
                    y: cyRef.current.height() / 2,
                  },
                })
              }
              title="Alejar"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
            >
              <ZoomOut size={15} />
            </button>

            <button
              type="button"
              onClick={() =>
                setMostrarEtiquetasAristas((prev) => !prev)
              }
              title="Mostrar/ocultar nombres de relaciones"
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                mostrarEtiquetasAristas
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Tag size={13} />
              Relaciones
            </button>

            <button
              type="button"
              onClick={() => {
                setTiposOcultos({});
                setFiltroEstadoEval("todas");
                setBusquedaNodo("");
                cyRef.current
                  ?.elements()
                  .removeClass("atenuado resaltado");
                cyRef.current?.fit(undefined, 45);
              }}
              title="Restablecer vista"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              <RotateCcw size={13} />
              Reset
            </button>

            <button
              type="button"
              onClick={exportarPNG}
              title="Descargar grafo como imagen PNG"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg"
            >
              <Download size={13} />
              PNG
            </button>

            <button
              type="button"
              onClick={alternarPantallaCompleta}
              title="Pantalla completa"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
            >
              {pantallaCompleta ? (
                <Minimize2 size={15} />
              ) : (
                <Maximize2 size={15} />
              )}
            </button>
          </div>
        </div>

        {/* Inspector lateral de nodo o relación */}
        {seleccionado && (
          <aside className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-sky-400 font-semibold">
                    {seleccionado.esArista
                      ? "Relación Cypher"
                      : `Nodo · ${String(seleccionado.datos.tipo ?? "Elemento")}`}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 break-all">
                    {String(
                      seleccionado.datos.nombre ??
                        seleccionado.datos.correlativo ??
                        seleccionado.datos.label ??
                        seleccionado.datos.id
                    ).replace(/\n/g, " ")}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    cyRef.current
                      ?.elements()
                      .removeClass("atenuado resaltado");
                    setSeleccionado(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  Cerrar
                </button>
              </div>

              {/* Estado de aprobación destacado si es Evaluación */}
              {seleccionado.datos.tipo === "Evaluacion" && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border ${
                    seleccionado.datos.aprobado
                      ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-300"
                      : "bg-rose-950/30 border-rose-700/50 text-rose-300"
                  }`}
                >
                  {seleccionado.datos.aprobado ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-semibold">
                    {seleccionado.datos.aprobado
                      ? "Evaluación APROBADA"
                      : "Evaluación NO APROBADA"}
                  </span>
                </div>
              )}

              {/* Lista limpia de atributos */}
              <div className="space-y-2 text-xs">
                {Object.entries(seleccionado.datos)
                  .filter(
                    ([clave]) =>
                      !["id", "label", "aprobado"].includes(clave)
                  )
                  .map(([clave, valor]) => (
                    <div
                      key={clave}
                      className="flex justify-between gap-3 bg-slate-900/90 border border-slate-800/80 rounded-lg px-3 py-2"
                    >
                      <span className="text-slate-400 capitalize">
                        {clave.replaceAll("_", " ")}
                      </span>
                      <span className="text-slate-100 font-medium text-right break-all">
                        {valor === null || valor === undefined
                          ? "—"
                          : String(valor)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Nodos vecinos conectados */}
              {seleccionado.vecinos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-300">
                    Conectado directamente con (
                    {seleccionado.vecinos.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {seleccionado.vecinos.map((vecino, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      >
                        {vecino}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón para enfocar aspirante si está en modo red general */}
            {seleccionado.datos.tipo === "Aspirante" &&
              typeof seleccionado.datos.correlativo === "string" &&
              onSeleccionarAspirante && (
                <button
                  type="button"
                  onClick={() =>
                    onSeleccionarAspirante(
                      String(seleccionado.datos.correlativo)
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles size={14} />
                  Ver grafo completo de este aspirante
                </button>
              )}
          </aside>
        )}
      </div>
    </div>
  );
}
