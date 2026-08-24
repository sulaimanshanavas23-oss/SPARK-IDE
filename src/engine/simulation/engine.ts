import type {
  BlockNode,
  NanoProject,
  SimEnvironment,
  SimState,
} from '../../types/nano'
import { getComponentDef } from '../../data/components'

/**
 * Nano Spark built-in MVP simulator.
 *
 * SCOPE (displayed honestly in the UI): executes *block programs* against a
 * simplified electrical model for the components the MVP supports
 * (analog light sensor, potentiometer, LEDs, buzzers). It is NOT a
 * circuit-level SPICE simulator — a Wokwi-class engine can replace this
 * module later behind the same interface.
 */

export const ANALOG_MAX = 1023

/** % light → analog reading. Bright = high value, dark = low value. */
export function envToAnalog(percent: number): number {
  return Math.round((Math.max(0, Math.min(100, percent)) / 100) * ANALOG_MAX)
}

export function createSimState(): SimState {
  return {
    iteration: 0,
    virtualMs: 0,
    variables: {},
    outputs: {},
    serialLog: [],
  }
}

let serialSeq = 0

function log(state: SimState, text: string): void {
  serialSeq += 1
  state.serialLog.push({
    id: serialSeq,
    time: new Date().toLocaleTimeString([], { hour12: false }),
    text: `[loop ${state.iteration}] ${text}`,
  })
  if (state.serialLog.length > 120) state.serialLog.splice(0, state.serialLog.length - 120)
}

/** Resolves which placed LED/buzzer instance a set-output targets. */
function resolveTarget(project: NanoProject, targetId: string) {
  const placed = project.circuit.components.find((c) => c.id === targetId)
  const def = placed ? getComponentDef(placed.defId) : undefined
  if (!placed || !def) return null
  if (def.simulationType === 'led' || def.simulationType === 'buzzer') return { placed, def }
  return null
}

/**
 * Executes exactly one pass of loop() and mutates state.
 * Pure enough to run headlessly (used by the test runner too).
 */
export function stepIteration(
  project: NanoProject,
  state: SimState,
  env: SimEnvironment,
): void {
  state.iteration += 1

  const analogOf = (sensor: 'light' | 'knob'): number =>
    sensor === 'light' ? envToAnalog(env.lightLevel) : envToAnalog(env.knobLevel)

  const evalRight = (right: number | string): number => {
    if (typeof right === 'number') return right
    const name = right.replace(/^var:/, '')
    return state.variables[name] ?? 0
  }

  function exec(nodes: BlockNode[]): void {
    for (const node of nodes) {
      switch (node.type) {
        case 'read-sensor': {
          const value = analogOf(node.sensor)
          state.variables[node.variable] = value
          log(state, `${node.variable} = ${value}`)
          break
        }
        case 'set-output': {
          const target = resolveTarget(project, node.targetId)
          if (!target) break
          const on = node.state === 'on'
          state.outputs[target.placed.id] = on
          log(state, `${target.placed.label} ${on ? 'ON' : 'OFF'}`)
          break
        }
        case 'delay':
          state.virtualMs += node.ms
          break
        case 'if-else': {
          const left = state.variables[node.condition.leftVariable] ?? 0
          const right = evalRight(node.condition.right)
          let branch: boolean
          switch (node.condition.op) {
            case '<': branch = left < right; break
            case '>': branch = left > right; break
            case '<=': branch = left <= right; break
            case '>=': branch = left >= right; break
            case '==': branch = left === right; break
          }
          exec(branch ? node.then : node.else)
          break
        }
      }
    }
  }

  exec(project.blocks.loop)
}

/** Runs up to maxIterations passes until outputs stabilise; returns final state. */
export function runUntilStable(
  project: NanoProject,
  env: SimEnvironment,
  maxIterations = 5,
): SimState {
  const state = createSimState()
  let previous = ''
  for (let i = 0; i < maxIterations; i++) {
    stepIteration(project, state, env)
    const snapshot = JSON.stringify(state.outputs)
    if (snapshot === previous && i > 0) break
    previous = snapshot
  }
  return state
}

/** First LED instance in the circuit — used by tests as "the lamp". */
export function primaryLedId(project: NanoProject): string | null {
  const led = project.circuit.components.find(
    (c) => getComponentDef(c.defId)?.simulationType === 'led',
  )
  return led?.id ?? null
}
