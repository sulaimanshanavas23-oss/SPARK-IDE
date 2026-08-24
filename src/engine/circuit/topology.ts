import type { CircuitData, PlacedComponent } from '../../types/nano'
import { getComponentDef } from '../../data/components'

/**
 * Circuit topology helpers.
 *
 * The MVP treats resistors, rails and wires as ideal conductors so a component
 * pin can be *traced* to the board pin it ultimately reaches. This is what lets
 * code generation and the simulator discover "the LDR signal reaches A0" without
 * the student configuring pins by hand — the Plug & Play idea.
 */

const CONDUCTIVE = new Set(['resistor', 'rail-5v', 'rail-gnd'])

interface Adjacency {
  // componentId -> pinId -> list of neighbour endpoints
  map: Map<string, Map<string, Array<{ componentId: string; pinId: string }>>>
}

function buildAdjacency(circuit: CircuitData): Adjacency {
  const map = new Map<string, Map<string, Array<{ componentId: string; pinId: string }>>>()

  const link = (a: { componentId: string; pinId: string }, b: { componentId: string; pinId: string }) => {
    const innerA = map.get(a.componentId) ?? new Map()
    innerA.set(a.pinId, [...(innerA.get(a.pinId) ?? []), { componentId: b.componentId, pinId: b.pinId }])
    map.set(a.componentId, innerA)

    const innerB = map.get(b.componentId) ?? new Map()
    innerB.set(b.pinId, [...(innerB.get(b.pinId) ?? []), { componentId: a.componentId, pinId: a.pinId }])
    map.set(b.componentId, innerB)
  }

  for (const conn of circuit.connections) {
    link(conn.from, conn.to)
  }

  // Conductive parts (resistors / rails) also join their own pins internally,
  // so a trace can flow THROUGH them.
  for (const comp of circuit.components) {
    const def = getComponentDef(comp.defId)
    if (!def || !CONDUCTIVE.has(def.id) || def.pins.length < 2) continue
    for (let i = 0; i < def.pins.length; i++) {
      for (let j = i + 1; j < def.pins.length; j++) {
        link({ componentId: comp.id, pinId: def.pins[i].id }, { componentId: comp.id, pinId: def.pins[j].id })
      }
    }
  }

  return { map }
}

export interface TraceResult {
  /** Board pin id (e.g. "A0", "D13", "5V", "GND.1") if one was reached. */
  boardPin?: string
  /** Resistor instances crossed on the way (used for the LED resistor check). */
  crossedResistors: string[]
}

/**
 * Walks the net from a starting pin until it reaches a pin on the board
 * component. Conductive parts (resistors / rails) are pass-through.
 */
export function traceToBoard(
  circuit: CircuitData,
  start: { componentId: string; pinId: string },
): TraceResult {
  const adjacency = buildAdjacency(circuit)
  const boardInstance = circuit.components.find((c) => getComponentDef(c.defId)?.category === 'board')

  const visited = new Set<string>()
  const queue: Array<{ componentId: string; pinId: string; crossed: string[] }> = [
    { ...start, crossed: [] },
  ]

  while (queue.length > 0) {
    const node = queue.shift()!
    const key = `${node.componentId}:${node.pinId}`
    if (visited.has(key)) continue
    visited.add(key)

    if (node.componentId === boardInstance?.id) {
      return { boardPin: node.pinId, crossedResistors: node.crossed }
    }

    const neighbours = adjacency.map.get(node.componentId)?.get(node.pinId) ?? []
    for (const nb of neighbours) {
      const placed = circuit.components.find((c) => c.id === nb.componentId)
      const def = getComponentDef(placed?.defId ?? '')
      const isConductor = def !== undefined && CONDUCTIVE.has(def.id)
      const nextCrossed =
        def?.id === 'resistor' && !node.crossed.includes(nb.componentId)
          ? [...node.crossed, nb.componentId]
          : node.crossed
      if (!isConductor && nb.componentId !== boardInstance?.id) continue
      queue.push({ componentId: nb.componentId, pinId: nb.pinId, crossed: nextCrossed })
    }
  }
  return { crossedResistors: [] }
}

/** Convenience: find placed components of a definition id. */
export function findComponentsOf(circuit: CircuitData, defId: string): PlacedComponent[] {
  return circuit.components.filter((c) => c.defId === defId)
}

export interface ResolvedPins {
  ldrPin?: string
  ledPins: Record<string, string> // led instance id -> board pin
  knobPin?: string
  warnings: string[]
}

/**
 * Resolves which board pins the program's sensor / outputs actually reach.
 * Falls back to sensible defaults with an explicit warning when tracing fails.
 */
export function resolvePinMap(circuit: CircuitData): ResolvedPins {
  const warnings: string[] = []
  const resolved: ResolvedPins = { ledPins: {}, warnings }

  const ldr = findComponentsOf(circuit, 'ldr')[0]
  if (ldr) {
    const trace = traceToBoard(circuit, { componentId: ldr.id, pinId: 'SIG' })
    if (trace.boardPin && trace.boardPin.startsWith('A')) {
      resolved.ldrPin = trace.boardPin
    } else {
      resolved.ldrPin = 'A0'
      warnings.push('LDR signal wire does not clearly reach an analog input — defaulted to A0.')
    }
  }

  const knob = findComponentsOf(circuit, 'potentiometer')[0]
  if (knob) {
    const trace = traceToBoard(circuit, { componentId: knob.id, pinId: 'SIG' })
    resolved.knobPin = trace.boardPin?.startsWith('A') ? trace.boardPin : 'A2'
  }

  for (const led of findComponentsOf(circuit, 'led')) {
    const trace = traceToBoard(circuit, { componentId: led.id, pinId: 'A' })
    if (trace.boardPin && /^D\d+$/.test(trace.boardPin)) {
      resolved.ledPins[led.id] = trace.boardPin
    } else {
      resolved.ledPins[led.id] = ''
    }
  }

  return resolved
}
