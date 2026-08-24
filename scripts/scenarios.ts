/* Scenario tests: diagnostics must catch real wiring mistakes. */
import { instantiateTemplate } from '../src/data/projects'
import { validateProject } from '../src/engine/circuit/validation'

function makeProject(mode: 'guided' | 'scratch', mutateCircuit?: (c: import('../src/types/nano').CircuitData) => void) {
  const built = instantiateTemplate('automatic-night-lamp', mode)!
  if (mutateCircuit) mutateCircuit(built.circuit)
  return {
    id: 'x', name: built.name, templateId: 'automatic-night-lamp',
    createdAt: 0, updatedAt: 0, boardId: 'arduino-uno',
    circuit: built.circuit, blocks: built.blocks,
    code: { content: '', syncedFromBlocks: true }, notes: '', flags: {},
  } as import('../src/types/nano').NanoProject
}

// Scenario A: LED wired straight to D13 without its resistor.
const noResistor = makeProject('guided', (circuit) => {
  const led = circuit.components.find((c) => c.defId === 'led')!
  const ledRes = circuit.components.find((c) => c.defId === 'resistor' && c.props?.ohms === 220)
    ?? circuit.components.find((c) => c.defId === 'resistor' && circuit.connections.some(
        (w) => (w.from.componentId === c.id || w.to.componentId === c.id) &&
          [w.from.pinId, w.to.pinId].includes('A'),
      ))!
  const board = circuit.components.find((c) => c.defId === 'board-uno')!
  // remove resistor + its wires; wire LED anode straight to D13
  circuit.components = circuit.components.filter((c) => c.id !== ledRes.id)
  circuit.connections = circuit.connections.filter(
    (w) => w.from.componentId !== ledRes.id && w.to.componentId !== ledRes.id,
  )
  circuit.connections.push({
    id: 'wdirect', from: { componentId: board.id, pinId: 'D13' }, to: { componentId: led.id, pinId: 'A' },
  })
})
const reportA = validateProject(noResistor)
console.log('A missing-resistor warnings:', reportA.issues.filter((i) => i.id.includes('no-resistor')).length)

// Scenario B: LDR signal on a digital pin instead of analog.
const badPin = makeProject('guided', (circuit) => {
  const ldr = circuit.components.find((c) => c.defId === 'ldr')!
  const board = circuit.components.find((c) => c.defId === 'board-uno')!
  circuit.connections = circuit.connections.map((w) =>
    w.from.componentId === ldr.id && w.from.pinId === 'SIG'
      ? { ...w, to: { componentId: board.id, pinId: 'D7' } }
      : w.to.componentId === ldr.id && w.to.pinId === 'SIG'
        ? { ...w, from: { componentId: board.id, pinId: 'D7' } }
        : w,
  )
})
const reportB = validateProject(badPin)
console.log('B not-analog error:', reportB.issues.some((i) => i.severity === 'error' && i.title.includes('analog input')))

// Scenario C: scratch project with only a board + delay block → no false positives.
const scratch = makeProject('scratch')
const reportC = validateProject(scratch)
console.log('C scratch issues:', reportC.issues.length)

if (!reportA.issues.some((i) => i.id.includes('no-resistor'))) throw new Error('missing-resistor not detected')
if (!reportB.issues.some((i) => i.severity === 'error' && i.title.includes('analog input'))) throw new Error('wrong-pin not detected')
if (reportC.issues.length !== 0) throw new Error('scratch produced false positives')
console.log('SCENARIOS OK')
