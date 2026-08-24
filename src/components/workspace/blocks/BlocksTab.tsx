import { useMemo } from 'react'
import { useStudio } from '../../../state/studio'
import type { BlockNode, BlockProgram, NanoProject, SensorKind } from '../../../types/nano'
import { getComponentDef } from '../../../data/components'
import {
  appendToBranch,
  cloneNodes,
  collectVariables,
  findAndTransform,
  moveInList,
  newBlockId,
  removeFromTree,
} from '../../../engine/blocks/treeOps'
import { Chip, EmptyState } from '../../ui'

interface PaletteItem {
  key: string
  label: string
  icon: string
  hint: string
  make: () => BlockNode
}

function paletteItems(project: NanoProject): Array<{ group: string; items: PaletteItem[] }> {
  const outputs = project.circuit.components.filter((c) => {
    const def = getComponentDef(c.defId)
    return def?.simulationType === 'led' || def?.simulationType === 'buzzer'
  })
  const defaultTarget = outputs[0]?.id ?? ''

  return [
    {
      group: 'Sensing',
      items: [
        {
          key: 'read-light',
          label: 'Read light (LDR)',
          icon: '☀️',
          hint: 'analogRead from the LDR pin into a variable',
          make: () => ({ id: newBlockId(), type: 'read-sensor', sensor: 'light' as SensorKind, variable: 'lightValue' }),
        },
        {
          key: 'read-knob',
          label: 'Read knob',
          icon: '🎛️',
          hint: 'analogRead from a potentiometer',
          make: () => ({ id: newBlockId(), type: 'read-sensor', sensor: 'knob', variable: 'knobValue' }),
        },
      ],
    },
    {
      group: 'Control',
      items: [
        {
          key: 'if-else',
          label: 'If / else',
          icon: '🔀',
          hint: 'make a decision',
          make: () => ({
            id: newBlockId(),
            type: 'if-else',
            condition: { leftVariable: 'lightValue', op: '<', right: 500 },
            then: [],
            else: [],
          }),
        },
        {
          key: 'delay',
          label: 'Wait…',
          icon: '⏳',
          hint: 'pause the loop',
          make: () => ({ id: newBlockId(), type: 'delay', ms: 200 }),
        },
      ],
    },
    {
      group: 'Outputs',
      items: [
        {
          key: 'led-on',
          label: 'Output ON',
          icon: '💡',
          hint: 'drive an LED / buzzer HIGH',
          make: () => ({ id: newBlockId(), type: 'set-output', targetId: defaultTarget, state: 'on' }),
        },
        {
          key: 'led-off',
          label: 'Output OFF',
          icon: '⚫',
          hint: 'drive an LED / buzzer LOW',
          make: () => ({ id: newBlockId(), type: 'set-output', targetId: defaultTarget, state: 'off' }),
        },
      ],
    },
  ]
}

export function BlocksTab({ project }: { project: NanoProject }) {
  const studio = useStudio()

  const setProgram = (mutate: (loop: BlockNode[]) => BlockNode[]) => {
    const next: BlockProgram = { loop: mutate(cloneNodes(project.blocks.loop)) }
    studio.updateBlocks(project.id, next)
  }

  const outputTargets = useMemo(
    () =>
      project.circuit.components.filter((c) => {
        const def = getComponentDef(c.defId)
        return def?.simulationType === 'led' || def?.simulationType === 'buzzer'
      }),
    [project.circuit.components],
  )

  const variables = useMemo(() => collectVariables(project.blocks.loop), [project.blocks.loop])
  const palette = paletteItems(project)

  return (
    <div className="blocks-tab">
      <aside className="palette">
        <h3>Blocks</h3>
        <p className="dim small">Click to add to your loop</p>
        {palette.map((group) => (
          <div key={group.group} className="palette-group">
            <h4>{group.group}</h4>
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                className="block-palette-item"
                title={item.hint}
                onClick={() => setProgram((loop) => [...loop, item.make()])}
              >
                <span aria-hidden>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <div className="program-col">
        <div className="canvas-toolbar">
          <Chip tone="accent">WHEN program starts → LOOP forever:</Chip>
          <span className="spacer" />
          {project.code.syncedFromBlocks ? (
            <Chip tone="good">code auto-synced</Chip>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={() => studio.updateCode(project.id, '', true)}
              title="Regenerate code from these blocks"
            >
              ⚠ code was hand-edited — resync?
            </button>
          )}
        </div>

        <div className="program-canvas">
          {project.blocks.loop.length === 0 ? (
            <EmptyState
              icon="🧱"
              title="Empty loop"
              hint="Add a “Read light” block, an “If/else”, and “Output ON/OFF” blocks to build the night lamp logic."
            />
          ) : (
            <ol className="block-list">
              {project.blocks.loop.map((node) => (
                <BlockRow
                  key={node.id}
                  node={node}
                  depth={0}
                  project={project}
                  targets={outputTargets}
                  variables={variables}
                  onChange={(next) => setProgram((loop) => findAndTransform(loop, node.id, () => next))}
                  onDelete={() => setProgram((loop) => removeFromTree(loop, node.id).nodes)}
                  onMove={(delta) => setProgram((loop) => moveInList(loop, node.id, delta))}
                  onAppendToBranch={(branch, child) =>
                    setProgram((loop) => appendToBranch(loop, node.id, branch, child))
                  }
                />
              ))}
            </ol>
          )}
        </div>

        <p className="dim small blocks-note">
          These blocks generate real Arduino C/C++. Open the Code tab to read and edit it.
        </p>
      </div>
    </div>
  )
}

/* --------------------------------- Rows ---------------------------------- */

interface RowProps {
  node: BlockNode
  depth: number
  project: NanoProject
  targets: NanoProject['circuit']['components']
  variables: string[]
  onChange(next: BlockNode): void
  onDelete(): void
  onMove(delta: -1 | 1): void
  onAppendToBranch(branch: 'then' | 'else', child: BlockNode): void
}

function RowChrome({
  children,
  onDelete,
  onMove,
  color,
}: RowProps & { children: React.ReactNode; color: string }) {
  return (
    <li className="block-row" style={{ borderLeftColor: color }}>
      <div className="block-main">
        <div className="block-content">{children}</div>
        <div className="block-controls">
          <button type="button" title="Move up" onClick={() => onMove(-1)}>
            ↑
          </button>
          <button type="button" title="Move down" onClick={() => onMove(1)}>
            ↓
          </button>
          <button type="button" title="Delete block" className="danger" onClick={onDelete}>
            ✕
          </button>
        </div>
      </div>
    </li>
  )
}

const PALETTE_SUBSET = ['read-light', 'read-knob', 'if-else', 'delay', 'led-on', 'led-off'] as const

function BranchAdder({ onAdd }: { onAdd: (key: (typeof PALETTE_SUBSET)[number]) => void }) {
  return (
    <details className="branch-add">
      <summary>+ add</summary>
      <div className="branch-add-menu">
        <button type="button" onClick={() => onAdd('read-light')}>☀️ Read light</button>
        <button type="button" onClick={() => onAdd('read-knob')}>🎛️ Read knob</button>
        <button type="button" onClick={() => onAdd('led-on')}>💡 Output ON</button>
        <button type="button" onClick={() => onAdd('led-off')}>⚫ Output OFF</button>
        <button type="button" onClick={() => onAdd('delay')}>⏳ Wait…</button>
      </div>
    </details>
  )
}

function BlockRow(props: RowProps) {
  const { node } = props

  switch (node.type) {
    case 'read-sensor':
      return (
        <RowChrome {...props} color="#6bb8ff">
          <span className="block-title">READ</span>
          <select
            value={node.sensor}
            onChange={(e) => {
              const sensor = e.target.value as SensorKind
              props.onChange({
                ...node,
                sensor,
                variable: sensor === 'light' ? 'lightValue' : 'knobValue',
              })
            }}
          >
            <option value="light">☀️ light (LDR)</option>
            <option value="knob">🎛️ knob (potentiometer)</option>
          </select>
          <span className="block-arrow">→</span>
          <input
            className="var-input"
            value={node.variable}
            onChange={(e) => props.onChange({ ...node, variable: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
            aria-label="Variable name"
          />
        </RowChrome>
      )

    case 'set-output': {
      const targetLabel =
        props.targets.find((t) => t.id === node.targetId)?.label ?? '(pick an output)'
      return (
        <RowChrome {...props} color="#ff8a3d">
          <span className="block-title">SET OUTPUT</span>
          <select
            value={node.targetId}
            onChange={(e) => props.onChange({ ...node, targetId: e.target.value })}
          >
            {props.targets.length === 0 && <option value="">— no LED/buzzer in circuit —</option>}
            {props.targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={node.state}
            onChange={(e) => props.onChange({ ...node, state: e.target.value as 'on' | 'off' })}
          >
            <option value="on">ON</option>
            <option value="off">OFF</option>
          </select>
          {props.targets.length === 0 && (
            <span className="tiny warn-text">add an LED in Design first</span>
          )}
          <span className="dim tiny">{targetLabel !== node.targetId && targetLabel}</span>
        </RowChrome>
      )
    }

    case 'delay':
      return (
        <RowChrome {...props} color="#3dd68c">
          <span className="block-title">WAIT</span>
          <input
            type="number"
            min={10}
            max={5000}
            step={50}
            value={node.ms}
            onChange={(e) => props.onChange({ ...node, ms: Math.max(0, Number(e.target.value) || 0) })}
            aria-label="Milliseconds"
          />
          <span className="block-title">ms</span>
        </RowChrome>
      )

    case 'if-else':
      return (
        <li className="block-row if-row" style={{ borderLeftColor: '#c9a0ff' }}>
          <div className="block-main">
            <div className="block-content">
              <span className="block-title">IF</span>
              <select
                value={node.condition.leftVariable}
                onChange={(e) =>
                  props.onChange({
                    ...node,
                    condition: { ...node.condition, leftVariable: e.target.value },
                  })
                }
              >
                {props.variables.length === 0 && <option value="">(no variable)</option>}
                {props.variables.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={node.condition.op}
                onChange={(e) =>
                  props.onChange({
                    ...node,
                    condition: { ...node.condition, op: e.target.value as '<' | '>' | '<=' | '>=' | '==' },
                  })
                }
              >
                <option value="<">&lt;</option>
                <option value=">">&gt;</option>
                <option value="<=">&le;</option>
                <option value=">=">&ge;</option>
                <option value="==">=</option>
              </select>
              <input
                type="number"
                value={typeof node.condition.right === 'number' ? node.condition.right : 0}
                onChange={(e) =>
                  props.onChange({
                    ...node,
                    condition: { ...node.condition, right: Number(e.target.value) || 0 },
                  })
                }
                aria-label="Threshold"
              />
              <span className="block-arrow">?</span>
            </div>
            <div className="block-controls">
              <button type="button" title="Move up" onClick={() => props.onMove(-1)}>↑</button>
              <button type="button" title="Move down" onClick={() => props.onMove(1)}>↓</button>
              <button type="button" title="Delete block" className="danger" onClick={props.onDelete}>✕</button>
            </div>
          </div>

          <div className="branch-grid">
            {(['then', 'else'] as const).map((branch) => (
              <div key={branch} className={`branch-zone ${branch}`}>
                <header>{branch === 'then' ? 'THEN ✓' : 'ELSE ✗'}</header>
                <ol>
                  {node[branch].map((child) => (
                    <BlockRow
                      key={child.id}
                      node={child}
                      depth={props.depth + 1}
                      project={props.project}
                      targets={props.targets}
                      variables={props.variables}
                      onChange={(next) =>
                        props.onChange({
                          ...node,
                          [branch]: node[branch].map((c) => (c.id === child.id ? next : c)),
                        })
                      }
                      onDelete={() =>
                        props.onChange({
                          ...node,
                          [branch]: node[branch].filter((c) => c.id !== child.id),
                        })
                      }
                      onMove={(delta) =>
                        props.onChange({
                          ...node,
                          [branch]: (() => {
                            const list = [...node[branch]]
                            const i = list.findIndex((c) => c.id === child.id)
                            const j = i + delta
                            if (i === -1 || j < 0 || j >= list.length) return list
                            ;[list[i], list[j]] = [list[j], list[i]]
                            return list
                          })(),
                        })
                      }
                      onAppendToBranch={(b, c) =>
                        props.onChange({
                          ...node,
                          [branch]: appendToBranch(node[branch], child.id, b, c),
                        })
                      }
                    />
                  ))}
                </ol>
                <BranchAdder onAdd={(key) => props.onAppendToBranch(branch, makeSubBlock(key))} />
              </div>
            ))}
          </div>
        </li>
      )
  }
}

function makeSubBlock(key: (typeof PALETTE_SUBSET)[number]): BlockNode {
  switch (key) {
    case 'read-light':
      return { id: newBlockId(), type: 'read-sensor', sensor: 'light', variable: 'lightValue' }
    case 'read-knob':
      return { id: newBlockId(), type: 'read-sensor', sensor: 'knob', variable: 'knobValue' }
    case 'if-else':
      return {
        id: newBlockId(),
        type: 'if-else',
        condition: { leftVariable: 'lightValue', op: '<', right: 300 },
        then: [],
        else: [],
      }
    case 'led-on':
      return { id: newBlockId(), type: 'set-output', targetId: '', state: 'on' }
    case 'led-off':
      return { id: newBlockId(), type: 'set-output', targetId: '', state: 'off' }
    case 'delay':
      return { id: newBlockId(), type: 'delay', ms: 100 }
  }
}
