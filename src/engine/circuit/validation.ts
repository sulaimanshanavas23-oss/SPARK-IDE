import type { Issue, NanoProject } from '../../types/nano'
import { getComponentDef } from '../../data/components'
import { findComponentsOf, traceToBoard } from './topology'

/**
 * Design Rule Checker + student-friendly diagnostics.
 *
 * Only reports issues that can actually be verified from project data.
 * Every issue explains WHY and suggests a FIX, per the Nano Spark
 * beginner-debugging philosophy.
 */

export function validateCircuit(project: NanoProject): Issue[] {
  const issues: Issue[] = []
  const { circuit } = project
  const boards = circuit.components.filter((c) => getComponentDef(c.defId)?.category === 'board')

  if (boards.length === 0) {
    issues.push({
      id: 'no-board',
      severity: 'error',
      title: 'No board on the canvas',
      why: 'Every project needs a controller — it is the brain that runs your program.',
      fix: 'Drag an Arduino UNO from the Boards category onto the workspace.',
    })
    return issues
  }
  if (boards.length > 1) {
    issues.push({
      id: 'many-boards',
      severity: 'error',
      title: `${boards.length} boards placed`,
      why: 'A project has exactly one controller. Two boards cannot share one program.',
      fix: 'Delete the extra board.',
    })
  }

  const board = boards[0]

  /* ------------------------------- LDR checks ------------------------------ */
  const ldrs = findComponentsOf(circuit, 'ldr')
  for (const ldr of ldrs) {
    const trace = traceToBoard(circuit, { componentId: ldr.id, pinId: 'SIG' })
    if (!trace.boardPin) {
      issues.push({
        id: `ldr-${ldr.id}-floating`,
        severity: 'error',
        relatedComponentId: ldr.id,
        title: `${ldr.label} signal is not connected`,
        why: 'The Arduino can only read the sensor if its signal wire reaches an analog input like A0.',
        fix: 'Draw a wire from the LDR SIG pin to A0 on the Arduino.',
      })
    } else if (!trace.boardPin.startsWith('A')) {
      issues.push({
        id: `ldr-${ldr.id}-not-analog`,
        severity: 'error',
        relatedComponentId: ldr.id,
        title: `${ldr.label} is not connected to an analog input`,
        why: `It currently reaches ${trace.boardPin}. Light levels are tiny voltages — they need analog inputs (A0–A5), which can measure 0–1023 steps.`,
        fix: `Move the signal wire to an analog input such as A0.`,
      })
    }

    // Voltage divider sanity: SIG should see both 5V side and GND side.
    const vccTrace = traceToBoard(circuit, { componentId: ldr.id, pinId: 'VCC' })
    const gndSide = traceToBoard(circuit, { componentId: ldr.id, pinId: 'GND' })
    const vccOk = vccTrace.boardPin === '5V' || vccTrace.boardPin === 'VIN'
    const gndOk = gndSide.boardPin?.startsWith('GND') ?? false
    if (!vccOk || !gndOk) {
      issues.push({
        id: `ldr-${ldr.id}-divider`,
        severity: 'warning',
        relatedComponentId: ldr.id,
        title: `${ldr.label} voltage divider looks incomplete`,
        why: 'An LDR alone gives no measurable voltage. It needs a fixed resistor to GND so the junction between them produces a readable voltage.',
        fix: 'Connect LDR VCC to 5V, and LDR GND through a 10 kΩ resistor to GND.',
      })
    }
  }

  /* -------------------------------- LED checks ----------------------------- */
  const leds = findComponentsOf(circuit, 'led')
  for (const led of leds) {
    const anodeTrace = traceToBoard(circuit, { componentId: led.id, pinId: 'A' })
    if (!anodeTrace.boardPin) {
      issues.push({
        id: `led-${led.id}-floating`,
        severity: 'error',
        relatedComponentId: led.id,
        title: `${led.label} anode (+) is not connected`,
        why: 'Current cannot reach the LED, so it can never light up.',
        fix: 'Wire the LED anode through a resistor to a digital pin such as D13.',
      })
    } else if (!/^D\d+$/.test(anodeTrace.boardPin)) {
      issues.push({
        id: `led-${led.id}-not-digital`,
        severity: 'error',
        relatedComponentId: led.id,
        title: `${led.label} does not reach a digital pin`,
        why: `Its path ends at ${anodeTrace.boardPin}. LEDs switch on and off using digital pins (D0–D13).`,
        fix: 'Rewire so the LED reaches a digital pin such as D13.',
      })
    } else if (anodeTrace.crossedResistors.length === 0) {
      issues.push({
        id: `led-${led.id}-no-resistor`,
        severity: 'warning',
        relatedComponentId: led.id,
        title: `${led.label} has no series resistor`,
        why: 'Without resistance, too much current flows and the LED can burn out.',
        fix: 'Add a 220 Ω resistor between the digital pin and the LED anode.',
      })
    }

    const cathodeTrace = traceToBoard(circuit, { componentId: led.id, pinId: 'K' })
    if (!cathodeTrace.boardPin?.startsWith('GND')) {
      issues.push({
        id: `led-${led.id}-no-gnd`,
        severity: 'error',
        relatedComponentId: led.id,
        title: `${led.label} cathode (−) does not reach ground`,
        why: 'A circuit must be a complete loop. Without a path back to GND, no current can flow.',
        fix: 'Wire the LED cathode to a GND pin.',
      })
    }
  }

  /* ---------------------------- Buzzer basic check -------------------------- */
  for (const buzzer of findComponentsOf(circuit, 'buzzer')) {
    const plus = traceToBoard(circuit, { componentId: buzzer.id, pinId: '+' })
    if (!plus.boardPin) {
      issues.push({
        id: `buzz-${buzzer.id}-floating`,
        severity: 'warning',
        relatedComponentId: buzzer.id,
        title: `${buzzer.label} + pin is not connected`,
        why: 'The buzzer needs a signal from a digital pin to make sound.',
        fix: 'Wire buzzer + to a digital pin and − to GND.',
      })
    }
  }

  /* ------------------------- Program ↔ circuit match ------------------------ */
  const readsLight = programReadsSensor(project, 'light')
  if (readsLight && ldrs.length === 0) {
    issues.push({
      id: 'prog-needs-ldr',
      severity: 'error',
      title: 'Program reads the light sensor but no LDR exists',
      why: 'Your block program calls “read light”, but there is no LDR in the circuit to read from.',
      fix: 'Add an LDR to the Design tab, or change your blocks.',
    })
  }
  void board

  return issues
}

export function validateCode(code: string): Issue[] {
  const issues: Issue[] = []

  // Detect identifiers used in analog/digital calls but never declared.
  const usedPins = new Set<string>()
  const callPattern = /\b(analogRead|digitalWrite|pinMode)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)/g
  let m: RegExpExecArray | null
  while ((m = callPattern.exec(code)) !== null) {
    const name = m[2]
    if (!/^(A\d|D?\d+|HIGH|LOW|OUTPUT|INPUT)$/.test(name)) usedPins.add(name)
  }
  for (const name of usedPins) {
    const declared = new RegExp(`\\b(?:const\\s+int|int|#define)\\s+(?:.*\\s)?${name}\\b`).test(code)
    if (!declared) {
      issues.push({
        id: `code-undef-${name}`,
        severity: 'error',
        title: `CODE ERROR — ${name} is not defined`,
        why: 'Your code uses this pin name, but the program does not know what it refers to.',
        fix: `Define it before setup(), e.g.  const int ${name} = 13;`,
      })
    }
  }

  // digitalWrite without pinMode OUTPUT anywhere in setup.
  if (/digitalWrite\s*\(/.test(code) && !/pinMode\s*\([^)]*,\s*OUTPUT\s*\)/.test(code)) {
    issues.push({
      id: 'code-no-pinmode',
      severity: 'warning',
      title: 'digitalWrite() found but no pinMode(pin, OUTPUT)',
      why: 'A pin must be configured as an output before it can drive an LED or buzzer reliably.',
      fix: 'Add pinMode(LED_PIN, OUTPUT); inside setup().',
    })
  }

  return issues
}

function programReadsSensor(project: NanoProject, kind: 'light' | 'knob'): boolean {
  function walk(nodes: typeof project.blocks.loop): boolean {
    for (const node of nodes) {
      if (node.type === 'read-sensor' && node.sensor === kind) return true
      if (node.type === 'if-else') {
        if (walk(node.then) || walk(node.else)) return true
      }
    }
    return false
  }
  return walk(project.blocks.loop)
}

export interface ValidationReport {
  issues: Issue[]
  errors: number
  warnings: number
}

export function validateProject(project: NanoProject): ValidationReport {
  const issues = [...validateCircuit(project), ...validateCode(project.code.content)]
  return {
    issues,
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
  }
}
