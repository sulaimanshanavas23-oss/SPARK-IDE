import { useCallback, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@xyflow/react'
import { useStudio } from '../../../state/studio'
import type { NanoProject } from '../../../types/nano'
import type { CircuitData } from '../../../types/nano'
import { COMPONENT_DEFINITIONS, PALETTE_CATEGORIES, getComponentDef } from '../../../data/components'
import { validateProject } from '../../../engine/circuit/validation'
import { BoardNode, PartNode } from './nodes'
import type { PartNodeData } from './nodes'
import '@xyflow/react/dist/style.css'

const nodeTypes = { board: BoardNode, part: PartNode }

function wireColorFor(kind: string): string | undefined {
  switch (kind) {
    case 'power-5v':
    case 'power-3v3':
      return '#ff5f56'
    case 'ground':
      return '#9aa4b8'
    case 'analog':
      return '#ffd166'
    case 'digital':
      return '#6bb8ff'
    default:
      return '#c9a0ff'
  }
}

interface DesignTabProps {
  project: NanoProject
}

function Canvas({ project }: DesignTabProps) {
  const studio = useStudio()
  const { screenToFlowPosition } = useReactFlow()
  const wrapper = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const history = useRef<{ undo: CircuitData[]; redo: CircuitData[] }>({ undo: [], redo: [] })
  const [historyInfo, setHistoryInfo] = useState({ canUndo: false, canRedo: false })

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  /* ------------------------------ History ------------------------------ */
  const pushHistory = useCallback(() => {
    history.current.undo.push(JSON.parse(JSON.stringify(project.circuit)) as CircuitData)
    if (history.current.undo.length > 60) history.current.undo.shift()
    history.current.redo = []
    setHistoryInfo({ canUndo: true, canRedo: false })
  }, [project.circuit])

  const applyCircuit = useCallback(
    (next: CircuitData) => {
      studio.updateCircuit(project.id, next)
    },
    [studio, project.id],
  )

  const undo = useCallback(() => {
    const prev = history.current.undo.pop()
    if (!prev) return
    history.current.redo.push(JSON.parse(JSON.stringify(project.circuit)) as CircuitData)
    applyCircuit(prev)
    setHistoryInfo({
      canUndo: history.current.undo.length > 0,
      canRedo: true,
    })
  }, [applyCircuit, project.circuit])

  const redo = useCallback(() => {
    const next = history.current.redo.pop()
    if (!next) return
    history.current.undo.push(JSON.parse(JSON.stringify(project.circuit)) as CircuitData)
    applyCircuit(next)
    setHistoryInfo({
      canUndo: true,
      canRedo: history.current.redo.length > 0,
    })
  }, [applyCircuit, project.circuit])

  /* --------------------------- Flow derivation -------------------------- */

  const [selNodeIds, setSelNodeIds] = useState<string[]>([])
  const [selEdgeIds, setSelEdgeIds] = useState<string[]>([])

  const nodes: Node[] = useMemo(
    () =>
      project.circuit.components.map((placed) => {
        const def = getComponentDef(placed.defId)!
        return {
          id: placed.id,
          type: def.category === 'board' ? 'board' : 'part',
          position: { x: placed.x, y: placed.y },
          data: { placed, def } as PartNodeData,
          selected: selNodeIds.includes(placed.id),
        }
      }),
    [project.circuit.components, selNodeIds],
  )

  const edges: Edge[] = useMemo(
    () =>
      project.circuit.connections.map((conn) => {
        const fromComp = project.circuit.components.find((c) => c.id === conn.from.componentId)
        const fromDef = fromComp ? getComponentDef(fromComp.defId) : undefined
        const fromPin = fromDef?.pins.find((p) => p.id === conn.from.pinId)
        return {
          id: conn.id,
          source: conn.from.componentId,
          sourceHandle: conn.from.pinId,
          target: conn.to.componentId,
          targetHandle: conn.to.pinId,
          selected: selEdgeIds.includes(conn.id),
          style: { stroke: conn.color ?? wireColorFor(fromPin?.kind ?? 'signal'), strokeWidth: 2 },
          type: 'smoothstep',
          pathOptions: { borderRadius: 12 },
        } as Edge
      }),
    [project.circuit, selEdgeIds],
  )

  /* ------------------------------- Mutations ---------------------------- */

  const addComponent = useCallback(
    (defId: string, x: number, y: number) => {
      const def = getComponentDef(defId)
      if (!def) return
      if (def.category === 'board') {
        const existing = project.circuit.components.some(
          (c) => getComponentDef(c.defId)?.category === 'board',
        )
        if (existing) {
          showToast('Only one board per project — delete the current one first.')
          return
        }
      }
      pushHistory()
      const count = project.circuit.components.filter((c) => c.defId === defId).length + 1
      const placed = {
        id: `${defId}-${Date.now().toString(36)}`,
        defId,
        label: count > 1 ? `${def.name} ${count}` : def.name,
        x,
        y,
        rotation: 0,
        props: def.defaults ? { ...def.defaults } : undefined,
      }
      applyCircuit({ ...project.circuit, components: [...project.circuit.components, placed] })
    },
    [project.circuit, applyCircuit, pushHistory, showToast],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection
      if (!source || !target || !sourceHandle || !targetHandle) return
      if (source === target && sourceHandle === targetHandle) return

      const findPinKind = (componentId: string, pinId: string): string | null => {
        const comp = project.circuit.components.find((c) => c.id === componentId)
        const def = comp ? getComponentDef(comp.defId) : undefined
        return def?.pins.find((p) => p.id === pinId)?.kind ?? null
      }
      const sourceKind = findPinKind(source, sourceHandle)
      const targetKind = findPinKind(target, targetHandle)

      // Educational short-circuit guard.
      if (
        (sourceKind?.startsWith('power') && targetKind === 'ground') ||
        (sourceKind === 'ground' && targetKind?.startsWith('power'))
      ) {
        showToast('⚠ That would connect 5V straight to GND — a short circuit!')
        return
      }

      const duplicate = project.circuit.connections.some(
        (c) =>
          (c.from.componentId === source &&
            c.from.pinId === sourceHandle &&
            c.to.componentId === target &&
            c.to.pinId === targetHandle) ||
          (c.from.componentId === target &&
            c.from.pinId === targetHandle &&
            c.to.componentId === source &&
            c.to.pinId === sourceHandle),
      )
      if (duplicate) {
        showToast('Those pins are already connected.')
        return
      }

      pushHistory()
      const color =
        wireColorFor(sourceKind ?? 'signal') ?? wireColorFor(targetKind ?? 'signal')
      applyCircuit({
        ...project.circuit,
        connections: [
          ...project.circuit.connections,
          {
            id: `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            from: { componentId: source, pinId: sourceHandle },
            to: { componentId: target, pinId: targetHandle },
            color,
          },
        ],
      })
    },
    [project.circuit, applyCircuit, pushHistory, showToast],
  )

  const deleteSelected = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      if (nodeIds.length === 0 && edgeIds.length === 0) return
      pushHistory()
      const removedBoards = nodeIds.filter((id) => {
        const comp = project.circuit.components.find((c) => c.id === id)
        return comp && getComponentDef(comp.defId)?.category === 'board'
      })
      if (removedBoards.length > 0 && project.circuit.components.length > nodeIds.length) {
        // Deleting the board removes everything wired to it conceptually; simplest honest rule:
        showToast('Board deleted — components stay, wires to board pins are removed.')
      }
      const components = project.circuit.components.filter((c) => !nodeIds.includes(c.id))
      const connections = project.circuit.connections.filter(
        (c) =>
          !edgeIds.includes(c.id) &&
          !nodeIds.includes(c.from.componentId) &&
          !nodeIds.includes(c.to.componentId),
      )
      applyCircuit({ components, connections })
    },
    [project.circuit, applyCircuit, pushHistory, showToast],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let needsCommit = false
      let nextComponents = project.circuit.components

      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          nextComponents = nextComponents.map((c) =>
            c.id === change.id
              ? { ...c, x: change.position!.x, y: change.position!.y }
              : c,
          )
          if (!change.dragging) needsCommit = true
        }
      }

      const removals = changes.filter((c) => c.type === 'remove') as Array<{ type: 'remove'; id: string }>

      const selectChanges = changes.filter(
        (c): c is Extract<NodeChange, { type: 'select' }> => c.type === 'select',
      )
      if (selectChanges.length > 0) {
        setSelNodeIds((prev) => {
          const next = new Set(prev)
          for (const c of selectChanges) {
            if (c.selected) next.add(c.id)
            else next.delete(c.id)
          }
          return [...next]
        })
      }

      if (needsCommit || removals.length > 0) {
        if (removals.length > 0) {
          deleteSelected(
            removals.map((r) => r.id),
            [],
          )
        } else {
          applyCircuit({ ...project.circuit, components: nextComponents })
        }
      }
    },
    [project.circuit, applyCircuit, deleteSelected],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removals = changes.filter((c) => c.type === 'remove') as Array<{ type: 'remove'; id: string }>
      const selectChanges = changes.filter(
        (c): c is Extract<EdgeChange, { type: 'select' }> => c.type === 'select',
      )
      if (selectChanges.length > 0) {
        setSelEdgeIds((prev) => {
          const next = new Set(prev)
          for (const c of selectChanges) {
            if (c.selected) next.add(c.id)
            else next.delete(c.id)
          }
          return [...next]
        })
      }
      if (removals.length > 0) {
        deleteSelected(
          [],
          removals.map((r) => r.id),
        )
      }
    },
    [deleteSelected],
  )

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const defId = event.dataTransfer.getData('application/nano-part')
      if (!defId || !wrapper.current) return
      const point = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addComponent(defId, Math.round(point.x / 10) * 10 - 60, Math.round(point.y / 10) * 10 - 30)
    },
    [addComponent, screenToFlowPosition],
  )

  /* ------------------------------- Selection ----------------------------- */

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const inspectorComponent = useMemo(() => {
    if (!selectedId) return null
    return project.circuit.components.find((c) => c.id === selectedId) ?? null
  }, [selectedId, project.circuit])

  /* ------------------------------ Validation ----------------------------- */

  const report = useMemo(() => validateProject(project), [project])

  return (
    <div className="design-tab">
      <aside className="palette">
        <h3>Components</h3>
        <p className="dim small">Drag onto the canvas</p>
        {PALETTE_CATEGORIES.map((cat) => {
          const items = COMPONENT_DEFINITIONS.filter((d) => d.category === cat.id)
          if (items.length === 0) return null
          return (
            <div key={cat.id} className="palette-group">
              <h4>{cat.label}</h4>
              {items.map((def) => (
                <div
                  key={def.id}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/nano-part', def.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  title={def.description}
                >
                  <span className="pi-icon" style={{ background: `${def.color}22`, color: def.color }}>
                    {def.icon}
                  </span>
                  <span>{def.name}</span>
                </div>
              ))}
            </div>
          )
        })}
      </aside>

      <div className="canvas-col">
        <div className="canvas-toolbar">
          <button type="button" onClick={undo} disabled={!historyInfo.canUndo}>
            ↩ Undo
          </button>
          <button type="button" onClick={redo} disabled={!historyInfo.canRedo}>
            ↪ Redo
          </button>
          <span className="toolbar-hint dim">
            Drag pins together to wire · select a wire and press Delete to cut it · scroll to zoom
          </span>
          <span className="spacer" />
          <span className={`check-pill ${report.errors > 0 ? 'bg-err text-err' : report.warnings > 0 ? 'bg-warn text-warn' : 'bg-ok text-ok'}`}>
            {report.errors > 0
              ? `✗ ${report.errors} circuit error${report.errors === 1 ? '' : 's'}`
              : report.warnings > 0
                ? `⚠ ${report.warnings} warning${report.warnings === 1 ? '' : 's'}`
                : '✓ circuit ok'}
          </span>
        </div>

        <div className="canvas-host" ref={wrapper} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            onNodeDragStart={pushHistory}
            snapToGrid
            snapGrid={[10, 10]}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="bg-ink-DEFAULT" />
            <Controls showInteractive={false} />
          </ReactFlow>
          {toast && <div className="canvas-toast">{toast}</div>}
        </div>
      </div>

      <aside className="design-side">
        <InspectorPanel
          component={inspectorComponent}
          project={project}
          onRename={(label) => {
            if (!inspectorComponent) return
            pushHistory()
            applyCircuit({
              ...project.circuit,
              components: project.circuit.components.map((c) =>
                c.id === inspectorComponent.id ? { ...c, label } : c,
              ),
            })
          }}
          onRotate={() => {
            if (!inspectorComponent) return
            pushHistory()
            applyCircuit({
              ...project.circuit,
              components: project.circuit.components.map((c) =>
                c.id === inspectorComponent.id ? { ...c, rotation: (c.rotation + 90) % 360 } : c,
              ),
            })
          }}
          onDuplicate={() => {
            if (!inspectorComponent) return
            pushHistory()
            const clone = {
              ...inspectorComponent,
              id: `${inspectorComponent.defId}-${Date.now().toString(36)}`,
              label: `${inspectorComponent.label} copy`,
              x: inspectorComponent.x + 40,
              y: inspectorComponent.y + 40,
            }
            applyCircuit({ ...project.circuit, components: [...project.circuit.components, clone] })
          }}
          onDelete={() => {
            if (!inspectorComponent) return
            setSelectedId(null)
            deleteSelected([inspectorComponent.id], [])
          }}
        />

        <section className="panel check-panel">
          <header className="panel-head">
            <h3>Circuit check</h3>
          </header>
          <div className="panel-body check-list">
            {report.issues.length === 0 && (
              <p className="dim">Everything looks good — power, ground and signals are all sensible.</p>
            )}
            {report.issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                className={`check-item sev-${issue.severity}`}
                onClick={() => issue.relatedComponentId && setSelectedId(issue.relatedComponentId)}
              >
                <strong>
                  {issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ'}{' '}
                  {issue.title}
                </strong>
                {issue.why && <span className="why">Why? {issue.why}</span>}
                {issue.fix && <span className="fix">Fix: {issue.fix}</span>}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

function InspectorPanel({
  component,
  project,
  onRename,
  onRotate,
  onDuplicate,
  onDelete,
}: {
  component: NanoProject['circuit']['components'][number] | null
  project: NanoProject
  onRename: (label: string) => void
  onRotate: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [label, setLabel] = useState(component?.label ?? '')
  const key = component?.id ?? 'none'
  const def = component ? getComponentDef(component.defId) : undefined

  return (
    <section className="panel inspector-panel" key={key}>
      <header className="panel-head">
        <h3>Inspector</h3>
      </header>
      <div className="panel-body">
        {!component || !def ? (
          <p className="dim">Select a component on the canvas to inspect it.</p>
        ) : (
          <>
            <div className="insp-headline">
              <span className="pi-icon big" style={{ background: `${def.color}22`, color: def.color }}>
                {def.icon}
              </span>
              <div>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={() => label.trim() && label !== component.label && onRename(label.trim())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  aria-label="Component name"
                />
                <span className="dim small">{def.category}</span>
              </div>
            </div>
            <p className="small">{def.description}</p>
            {component.props && Object.keys(component.props).length > 0 && (
              <div className="prop-rows">
                {Object.entries(component.props).map(([k, v]) => (
                  <div key={k} className="prop-row">
                    <span>{k}</span>
                    <strong>{k === 'ohms' ? `${v} Ω` : v}</strong>
                  </div>
                ))}
              </div>
            )}
            <details open>
              <summary>Why this part?</summary>
              <p className="small">{def.learn}</p>
            </details>
            <div className="insp-actions">
              <button type="button" onClick={onRotate}>
                ⟳ Rotate
              </button>
              <button type="button" onClick={onDuplicate}>
                ⧉ Duplicate
              </button>
              <button type="button" className="danger" onClick={onDelete}>
                ✕ Delete
              </button>
            </div>
            <p className="dim tiny">
              Project board: {project.boardId} · wires: {project.circuit.connections.length}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export function DesignTab(props: DesignTabProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}
