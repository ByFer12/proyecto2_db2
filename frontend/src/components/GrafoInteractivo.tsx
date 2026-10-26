
import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import type { Core, ElementDefinition } from "cytoscape";

interface GrafoData {
  nodes: ElementDefinition[];
  edges: ElementDefinition[];
}

interface Props {
  grafo: GrafoData;
}

export default function GrafoInteractivo({ grafo }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [seleccionado, setSeleccionado] = useState<
    Record<string, unknown> | null
  >(null);

  useEffect(() => {
    if (!contenedorRef.current) return;

    setSeleccionado(null);

    const cy = cytoscape({
      container: contenedorRef.current,
      elements: [...grafo.nodes, ...grafo.edges],

      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#64748b",
            color: "#ffffff",
            "font-size": "11px",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "100px",
            width: 85,
            height: 85,
            "border-width": 2,
            "border-color": "#e2e8f0",
          },
        },
        {
          selector: 'node[tipo = "Aspirante"]',
          style: {
            "background-color": "#2563eb",
            width: 110,
            height: 110,
          },
        },
        {
          selector: 'node[tipo = "Evaluacion"]',
          style: {
            "background-color": "#7c3aed",
          },
        },
        {
          selector: 'node[tipo = "Materia"]',
          style: {
            "background-color": "#059669",
          },
        },
        {
          selector: 'node[tipo = "Carrera"]',
          style: {
            "background-color": "#d97706",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#cbd5e1",
            "font-size": "9px",
            "text-rotation": "autorotate",
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#38bdf8",
            "border-width": 5,
          },
        },
      ],

      layout: {
        name: "cose",
        animate: false,
        padding: 60,
        nodeRepulsion: () => 250000,
      },

      minZoom: 0.15,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    });

    cyRef.current = cy;

    cy.on("tap", "node", (evento) => {
      setSeleccionado({
        ...evento.target.data(),
      });
    });

    cy.on("tap", "edge", (evento) => {
      setSeleccionado({
        ...evento.target.data(),
      });
    });

    cy.on("tap", (evento) => {
      if (evento.target === cy) {
        setSeleccionado(null);
      }
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [grafo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-slate-300">
        <span>🔵 Aspirante</span>
        <span>🟣 Evaluación</span>
        <span>🟢 Materia</span>
        <span>🟠 Carrera</span>
      </div>

      <div
        ref={contenedorRef}
        className="w-full h-[550px] bg-slate-950 border border-slate-700 rounded-xl"
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => cyRef.current?.fit(undefined, 40)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
        >
          Centrar grafo
        </button>

        <button
          onClick={() => cyRef.current?.zoom({
            level: Math.min(cyRef.current.zoom() * 1.2, 3),
            renderedPosition: {
              x: cyRef.current.width() / 2,
              y: cyRef.current.height() / 2,
            },
          })}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
        >
          Acercar +
        </button>

        <button
          onClick={() => cyRef.current?.zoom({
            level: Math.max(cyRef.current.zoom() / 1.2, 0.15),
            renderedPosition: {
              x: cyRef.current.width() / 2,
              y: cyRef.current.height() / 2,
            },
          })}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
        >
          Alejar −
        </button>
      </div>

      {seleccionado && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">
            Propiedades del elemento seleccionado
          </h3>

          <pre className="text-sm text-sky-300 whitespace-pre-wrap break-all">
            {JSON.stringify(seleccionado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
