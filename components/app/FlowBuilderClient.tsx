'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
} from "reactflow";
import FlowBuilderCanvas from "./FlowBuilderCanvas";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { defaultNodes, defaultEdges } from "../../lib/defaultFlow";
import { CheckCircle2, Plus, Shapes, TriangleAlert } from "lucide-react";

type FlowResponse = {
  id: string;
  name: string;
  status: string;
  nodes: Node[];
  edges: Edge[];
  updated_at: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function FlowBuilderClient({ flowId }: { flowId: string }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(defaultEdges);
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"Entwurf" | "Aktiv">("Entwurf");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
    }
    loadUser();
  }, [router, supabase]);

  useEffect(() => {
    if (!userId) return;
    async function fetchFlow() {
      setLoading(true);
      const response = await fetch(`/api/flows/${flowId}?userId=${userId}`);
      if (response.status === 404) {
        setErrorMessage("Flow wurde nicht gefunden oder du hast keinen Zugriff.");
        setLoading(false);
        return;
      }
      const data: FlowResponse = await response.json();
      setFlowName(data.name);
      setStatus((data.status as "Entwurf" | "Aktiv") ?? "Entwurf");
      setNodes((data.nodes as Node[]) || defaultNodes);
      setEdges((data.edges as Edge[]) || defaultEdges);
      setLoading(false);
      setErrorMessage(null);
    }
    fetchFlow();
  }, [flowId, userId]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const handleConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            markerEnd: {
              type: "arrow",
            },
          },
          eds,
        ),
      ),
    [],
  );

  const addNode = (type: "message" | "choice") => {
    const id = uuid();
    const newNode: Node = {
      id,
      type: "default",
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      },
      data: {
        label: type === "message" ? "Neue Nachricht" : "Auswahl",
        variant: type,
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleNodeFieldChange = (field: string, value: string) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                [field]: value,
              },
            }
          : node,
      ),
    );
  };

  const removeSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((prev) => prev.filter((node) => node.id !== selectedNode.id));
    setEdges((prev) =>
      prev.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id,
      ),
    );
    setSelectedNodeId(null);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaveState("saving");
    const response = await fetch(`/api/flows/${flowId}?userId=${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: flowName,
        status,
        nodes,
        edges,
      }),
    });
    if (response.ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      const error = await response.json();
      setErrorMessage(error.error ?? "Speichern fehlgeschlagen");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  };

  if (loading || !userId) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Flow wird geladen …
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <input
            value={flowName}
            onChange={(event) => setFlowName(event.target.value)}
            className="text-3xl font-semibold text-slate-900 focus:outline-none"
          />
          <p className="text-sm text-slate-500">
            Bearbeite deinen Flow und speichere, um die Änderungen live zu schalten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "Entwurf" | "Aktiv")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="Entwurf">Entwurf</option>
            <option value="Aktiv">Aktiv</option>
          </select>
          <button
            onClick={handleSave}
            className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30"
            disabled={saveState === "saving"}
          >
            {saveState === "saving"
              ? "Speichert …"
              : saveState === "saved"
              ? "Gespeichert"
              : "Speichern"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addNode("message")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
            >
              <Plus className="h-4 w-4" />
              Nachricht
            </button>
            <button
              onClick={() => addNode("choice")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
            >
              <Shapes className="h-4 w-4" />
              Auswahl
            </button>
          </div>
          <FlowBuilderCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          />
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Eigenschaften</h2>
          {selectedNode ? (
            <>
              <div>
                <label className="text-sm font-semibold text-slate-500">
                  Nachricht / Label
                </label>
                <textarea
                  value={selectedNode.data?.label ?? ""}
                  onChange={(event) => handleNodeFieldChange("label", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  rows={4}
                />
              </div>
              <button
                onClick={removeSelectedNode}
                className="w-full rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600"
              >
                Node entfernen
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Wähle einen Node im Canvas aus, um die Inhalte zu bearbeiten.
            </div>
          )}
          {saveState === "saved" && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Änderungen gespeichert
            </div>
          )}
          {saveState === "error" && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              <TriangleAlert className="h-4 w-4" /> Speichern fehlgeschlagen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
