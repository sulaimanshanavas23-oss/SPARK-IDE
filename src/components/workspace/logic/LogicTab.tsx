import { useMemo } from 'react'
import { useStudio } from '../../../state/studio'
import type { NanoProject } from '../../../types/nano'
import { layoutFlow } from '../../../engine/blocks/logicLayout'
import { EmptyState } from '../../ui'

const FILL: Record<string, string> = {
  start: '#ffd400',
  read: '#6bb8ff',
  if: '#c9a0ff',
  action: '#ff8a3d',
  delay: '#3dd68c',
}

function boxLines(box: ReturnType<typeof layoutFlow>['boxes'][number]) {
  return { x: box.x, y: box.y, w: box.w, h: box.h, cx: box.x + box.w / 2 }
}

function edgePath(from: ReturnType<typeof boxLines>, to: ReturnType<typeof boxLines>): string {
  const sx = from.cx
  const sy = from.y + from.h
  const tx = to.cx
  const ty = to.y
  const midY = (sy + ty) / 2
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`
}

export function LogicTab({ project }: { project: NanoProject }) {
  const studio = useStudio()
  const layout = useMemo(() => layoutFlow(project.blocks.loop), [project.blocks.loop])

  const boxById = useMemo(
    () => new Map(layout.boxes.map((b) => [b.id, b])),
    [layout],
  )

  if (project.blocks.loop.length === 0) {
    return (
      <EmptyState
        icon="🧩"
        title="No logic yet"
        hint="Add blocks in the Blocks tab — this flowchart mirrors your program automatically."
      />
    )
  }

  return (
    <div className="logic-tab">
      <div className="canvas-host plain">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="flow-svg"
          role="img"
          aria-label="Program flowchart"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b94a7" />
            </marker>
          </defs>

          {layout.arrows.map((arrow, i) => {
            const from = boxById.get(arrow.fromId)
            const to = boxById.get(arrow.toId)
            if (!from || !to) return null
            const path = edgePath(boxLines(from), boxLines(to))
            return (
              <g key={i}>
                <path d={path} fill="none" stroke="#8b94a7" strokeWidth={1.6} markerEnd="url(#arrow)" />
                {arrow.label && (
                  <text
                    x={(boxLines(from).cx + boxLines(to).cx) / 2}
                    y={(boxLines(from).y + boxLines(to).y) / 2 - 6}
                    textAnchor="middle"
                    className="flow-label"
                    fill={arrow.label === 'YES' ? '#3dd68c' : '#ff8a3d'}
                  >
                    {arrow.label}
                  </text>
                )}
              </g>
            )
          })}

          {layout.boxes.map((box) => {
            const fill = FILL[box.kind] ?? '#888'
            const dark = box.kind === 'start'
            return (
              <g key={box.id}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={box.kind === 'if' ? 14 : 8}
                  fill={`${fill}${dark ? '' : '1f'}`}
                  stroke={fill}
                  strokeWidth={1.6}
                />
                <text x={box.x + 12} y={box.y + 22} className={`flow-title ${dark ? 'dark' : ''}`}>
                  {box.title}
                </text>
                {box.subtitle && (
                  <text x={box.x + 12} y={box.y + 40} className={`flow-sub ${dark ? 'dark' : ''}`}>
                    {box.subtitle}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <aside className="design-side">
        <section className="panel">
          <header className="panel-head">
            <h3>What am I looking at?</h3>
          </header>
          <div className="panel-body">
            <p className="small">
              This flowchart is your block program drawn as a diagram — the same way engineers plan
              before coding.
            </p>
            <ul className="legend">
              <li><span className="dot-swatch" style={{ background: FILL.start }} /> Start — board powers on</li>
              <li><span className="dot-swatch" style={{ background: FILL.read }} /> Read a sensor</li>
              <li><span className="dot-swatch" style={{ background: FILL.if }} /> Decision</li>
              <li><span className="dot-swatch" style={{ background: FILL.action }} /> Control an output</li>
              <li><span className="dot-swatch" style={{ background: FILL.delay }} /> Wait / loop</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h3>Pseudocode</h3>
          </header>
          <div className="panel-body">
            <pre className="pseudocode">{pseudo(project)}</pre>
            <button
              type="button"
              className="link-btn"
              onClick={() => studio.setTab('blocks')}
            >
              Edit the blocks →
            </button>
          </div>
        </section>
      </aside>
    </div>
  )
}

function pseudo(project: NanoProject): string {
  const lines: string[] = ['EVERY LOOP:']
  let depth = 1
  const pad = () => '  '.repeat(depth)
  for (const node of project.blocks.loop) {
    if (node.type === 'read-sensor') lines.push(`${pad()}${node.variable} ← read ${node.sensor}`)
    else if (node.type === 'delay') lines.push(`${pad()}wait ${node.ms} ms`)
    else if (node.type === 'set-output') lines.push(`${pad()}set output ${node.state.toUpperCase()}`)
    else if (node.type === 'if-else') {
      const right =
        typeof node.condition.right === 'number' ? String(node.condition.right) : String(node.condition.right).replace('var:', '')
      lines.push(`${pad()}IF ${node.condition.leftVariable} ${node.condition.op} ${right} THEN`)
      depth += 1
      for (const n of node.then) {
        if (n.type === 'set-output') lines.push(`${pad()}set LED ${n.state.toUpperCase()}`)
        else if (n.type === 'delay') lines.push(`${pad()}wait ${n.ms} ms`)
      }
      depth -= 1
      lines.push(`${pad()}ELSE`)
      depth += 1
      for (const n of node.else) {
        if (n.type === 'set-output') lines.push(`${pad()}set LED ${n.state.toUpperCase()}`)
        else if (n.type === 'delay') lines.push(`${pad()}wait ${n.ms} ms`)
      }
      depth -= 1
      lines.push(`${pad()}END IF`)
    }
  }
  return lines.join('\n')
}
