import type { NanoProject, SimEnvironment, TestCase } from '../../types/nano'
import { runUntilStable, primaryLedId } from '../simulation/engine'

export interface TestOutcome {
  case: TestCase
  passed: boolean
  actualLed: 'on' | 'off' | 'unknown'
}

export interface TestRunReport {
  outcomes: TestOutcome[]
  passed: number
  total: number
  ranAt: number
  skippedReason?: string
}

/**
 * Reusable test runner: drives the simulation engine with each test case's
 * environment and compares the resulting LED state with the expectation.
 */
export function runTests(project: NanoProject, cases: TestCase[]): TestRunReport {
  const ledId = primaryLedId(project)
  if (!ledId) {
    return {
      outcomes: [],
      passed: 0,
      total: cases.length,
      ranAt: Date.now(),
      skippedReason: 'No LED found in the circuit — add one in the Design tab.',
    }
  }

  const outcomes: TestOutcome[] = cases.map((testCase) => {
    const env: SimEnvironment = {
      lightLevel: testCase.lightLevel,
      knobLevel: project.circuit.components.some((c) => c.defId === 'potentiometer') ? 50 : 0,
    }
    const finalState = runUntilStable(project, env)
    const on = finalState.outputs[ledId]
    const actual: 'on' | 'off' = on ? 'on' : 'off'
    return {
      case: testCase,
      passed: actual === testCase.expectLed,
      actualLed: actual,
    }
  })

  return {
    outcomes,
    passed: outcomes.filter((o) => o.passed).length,
    total: outcomes.length,
    ranAt: Date.now(),
  }
}
