import type { BlockProgram, CircuitData, Connection, PlacedComponent, ProjectTemplate } from '../types/nano'

let uid = 0
function nid(prefix: string): string {
  uid += 1
  return `${prefix}-${uid}`
}

function place(
  defId: string,
  label: string,
  x: number,
  y: number,
  props?: Record<string, string | number>,
): PlacedComponent {
  return { id: nid(defId), defId, label, x, y, rotation: 0, props }
}

function wire(fromC: string, fromP: string, toC: string, toP: string, color?: string): Connection {
  return {
    id: nid('w'),
    from: { componentId: fromC, pinId: fromP },
    to: { componentId: toC, pinId: toP },
    color,
  }
}

const WIRE_5V = '#ff5f56'
const WIRE_GND = '#9aa4b8'
const WIRE_SIG = '#ffd166'
const WIRE_DIG = '#6bb8ff'

export const DEFAULT_THRESHOLD = 500

/* ------------------------- Starter circuit builders ------------------------ */

/** Fully-wired Automatic Night Lamp circuit + matching program (guided flow). */
function nightLampKit(): { circuit: CircuitData; blocks: BlockProgram } {
  const board = place('board-uno', 'Arduino UNO', 40, 170)
  const ldr = place('ldr', 'LDR', 470, 40)
  const dividerResistor = place('resistor', '10 kΩ resistor', 470, 220, { ohms: 10000 })
  const led = place('led', 'LED', 760, 60)
  const ledResistor = place('resistor', '220 Ω resistor', 680, 210, { ohms: 220 })

  const circuit: CircuitData = {
    components: [board, ldr, dividerResistor, ledResistor, led],
    connections: [
      // LDR voltage divider: 5V -> LDR; LDR signal -> A0; LDR -> 10k -> GND.
      wire(board.id, '5V', ldr.id, 'VCC', WIRE_5V),
      wire(ldr.id, 'SIG', board.id, 'A0', WIRE_SIG),
      wire(ldr.id, 'GND', dividerResistor.id, 'T1'),
      wire(dividerResistor.id, 'T2', board.id, 'GND.1', WIRE_GND),
      // LED branch: D13 -> 220 Ω -> LED anode; LED cathode -> GND.
      wire(board.id, 'D13', ledResistor.id, 'T1', WIRE_DIG),
      wire(ledResistor.id, 'T2', led.id, 'A', WIRE_DIG),
      wire(led.id, 'K', board.id, 'GND.2', WIRE_GND),
    ],
  }

  const blocks: BlockProgram = {
    loop: [
      { id: nid('b'), type: 'read-sensor', sensor: 'light', variable: 'lightValue' },
      {
        id: nid('b'),
        type: 'if-else',
        condition: { leftVariable: 'lightValue', op: '<', right: DEFAULT_THRESHOLD },
        then: [{ id: nid('b'), type: 'set-output', targetId: led.id, state: 'on' }],
        else: [{ id: nid('b'), type: 'set-output', targetId: led.id, state: 'off' }],
      },
      { id: nid('b'), type: 'delay', ms: 200 },
    ],
  }

  return { circuit, blocks }
}

/** Minimal scratch circuit — just the board ("Start from Scratch"). */
function blankKit(): { circuit: CircuitData; blocks: BlockProgram } {
  return {
    circuit: { components: [place('board-uno', 'Arduino UNO', 140, 180)], connections: [] },
    blocks: { loop: [{ id: nid('b'), type: 'delay', ms: 200 }] },
  }
}
void blankKit

/* --------------------------------- Templates ------------------------------- */

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'automatic-night-lamp',
    title: 'Automatic Night Lamp',
    emoji: '💡',
    difficulty: 'Beginner',
    level: 'Spark Create',
    boardId: 'arduino-uno',
    blurb:
      'Build a lamp that switches on automatically when the room goes dark — your first real sensor circuit.',
    learning: ['Analog input', 'Voltage divider', 'Digital output', 'Conditional logic'],
    componentsUsed: ['LDR', 'LED', 'Resistor ×2'],
    build: () => {
      const { circuit, blocks } = nightLampKit()
      return { name: 'Automatic Night Lamp', circuit, blocks }
    },
    tests: [
      {
        id: 't-bright',
        name: 'Bright room',
        lightLevel: 80,
        expectLed: 'off',
        explanation: 'With plenty of light the lamp should stay off.',
      },
      {
        id: 't-dark',
        name: 'Dark room',
        lightLevel: 20,
        expectLed: 'on',
        explanation: 'When it gets dark the lamp should switch itself on.',
      },
    ],
  },
]

export const TEMPLATE_MAP: Record<string, ProjectTemplate> = Object.fromEntries(
  PROJECT_TEMPLATES.map((t) => [t.id, t]),
)

/**
 * Builds a fresh project body from a template.
 * mode 'guided'  → pre-wired circuit + ready program.
 * mode 'scratch' → board only, minimal program.
 */
export function instantiateTemplate(
  templateId: string,
  mode: 'guided' | 'scratch',
): { name: string; circuit: CircuitData; blocks: BlockProgram } | null {
  const template = TEMPLATE_MAP[templateId]
  if (!template) return null
  const built = template.build()
  if (mode === 'guided') return built
  const scratch = blankKit()
  return { name: built.name, circuit: scratch.circuit, blocks: scratch.blocks }
}
