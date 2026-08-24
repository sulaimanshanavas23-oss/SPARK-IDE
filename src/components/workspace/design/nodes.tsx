import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { ComponentDefinition, PlacedComponent } from '../../../types/nano'

export interface PartNodeData extends Record<string, unknown> {
  placed: PlacedComponent
  def: ComponentDefinition
}

const SIDE_BY_KIND: Record<string, Position> = {
  'power-5v': Position.Left,
  'power-3v3': Position.Left,
  ground: Position.Left,
}

function PinDot({
  pinId,
  name,
  kind,
  side,
  hint,
}: {
  pinId: string
  name: string
  kind: string
  side: Position
  hint?: string
}) {
  return (
    <div className={`pin-row pin-${kind}`}>
      {side === Position.Left && (
        <Handle
          id={pinId}
          type="source"
          position={Position.Left}
          className={`nano-handle ${kind}`}
          title={`${name}${hint ? ` — ${hint}` : ''}`}
        />
      )}
      <span className="pin-name" title={hint}>
        {name}
      </span>
      {side === Position.Right && (
        <Handle
          id={pinId}
          type="source"
          position={Position.Right}
          className={`nano-handle ${kind}`}
          title={`${name}${hint ? ` — ${hint}` : ''}`}
        />
      )}
    </div>
  )
}

export const BoardNode = memo(function BoardNode({ data }: NodeProps) {
  const { placed, def } = data as PartNodeData
  const leftPins = def.pins.filter((p) => p.kind !== 'digital')
  const rightPins = def.pins.filter((p) => p.kind === 'digital')

  return (
    <div className="cnode board-node" style={{ borderColor: def.color }}>
      <header>
        <span aria-hidden>{def.icon}</span>
        <strong>{placed.label}</strong>
      </header>
      <div className="board-cols">
        <div className="board-col">
          {leftPins.map((p) => (
            <PinDot key={p.id} pinId={p.id} name={p.name} kind={p.kind} side={Position.Left} hint={p.hint} />
          ))}
        </div>
        <div className="board-col">
          {rightPins.map((p) => (
            <PinDot key={p.id} pinId={p.id} name={p.name} kind={p.kind} side={Position.Right} hint={p.hint} />
          ))}
        </div>
      </div>
    </div>
  )
})

export const PartNode = memo(function PartNode({ data }: NodeProps) {
  const { placed, def } = data as PartNodeData
  return (
    <div
      className={`cnode part-node cat-${def.category}`}
      style={{ transform: `rotate(${placed.rotation}deg)` }}
    >
      <div className="part-icon" style={{ background: `${def.color}22`, color: def.color }}>
        <span aria-hidden>{def.icon}</span>
      </div>
      <div className="part-body">
        <strong>{placed.label}</strong>
        {def.defaults && placed.props && (
          <span className="part-sub">
            {Object.entries(placed.props)
              .map(([k, v]) => (k === 'ohms' ? `${v} Ω` : `${k}: ${v}`))
              .join(' · ')}
          </span>
        )}
      </div>
      {def.pins.length > 0 && (
        <div className="part-pins">
          <div className="pin-stack">
            {def.pins
              .filter((p) => (SIDE_BY_KIND[p.kind] ?? Position.Right) === Position.Left)
              .map((p) => (
                <PinDot key={p.id} pinId={p.id} name={p.name} kind={p.kind} side={Position.Left} hint={p.hint} />
              ))}
          </div>
          <div className="pin-stack right">
            {def.pins
              .filter((p) => (SIDE_BY_KIND[p.kind] ?? Position.Right) === Position.Right)
              .map((p) => (
                <PinDot key={p.id} pinId={p.id} name={p.name} kind={p.kind} side={Position.Right} hint={p.hint} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
})
