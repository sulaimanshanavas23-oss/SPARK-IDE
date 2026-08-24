// Nano Spark IDE — core domain types.
// Everything in the platform is data-driven: boards, components, circuits,
// block programs, projects. Engines operate on this data only.

/* ---------------------------------- Pins ---------------------------------- */

export type PinKind =
  | 'power-5v'
  | 'power-3v3'
  | 'ground'
  | 'digital'
  | 'analog'
  | 'signal'

export interface PinDefinition {
  id: string
  name: string
  kind: PinKind
  /** Short educational note shown on hover. */
  hint?: string
}

/* ------------------------------ Components -------------------------------- */

export type ComponentCategory =
  | 'board'
  | 'sensor'
  | 'output'
  | 'passive'
  | 'input'
  | 'power'
  | 'structure'

/**
 * How the built-in MVP simulator can drive this component.
 * Kept as a string so future simulators (Wokwi-class) can extend it.
 */
export type SimulationType =
  | 'none'
  | 'analog-light-sensor'
  | 'analog-knob'
  | 'led'
  | 'buzzer'
  | 'button'
  | 'conductor'

export interface ComponentDefinition {
  id: string
  name: string
  category: ComponentCategory
  description: string
  /** Educational explanation surfaced in the inspector ("WHY THIS PART?"). */
  learn: string
  icon: string
  color: string
  pins: PinDefinition[]
  supportedBoards: string[]
  simulationType: SimulationType
  /** Optional default property values (e.g. resistor ohms). */
  defaults?: Record<string, string | number>
}

/* -------------------------------- Circuit --------------------------------- */

export interface PlacedComponent {
  id: string
  defId: string
  label: string
  x: number
  y: number
  rotation: number
  props?: Record<string, string | number>
}

/** One endpoint of a wire. */
export interface PinRef {
  componentId: string
  pinId: string
}

export interface Connection {
  id: string
  from: PinRef
  to: PinRef
  color?: string
}

export interface CircuitData {
  components: PlacedComponent[]
  connections: Connection[]
}

/* -------------------------------- Blocks ---------------------------------- */

export type SensorKind = 'light' | 'knob'

export interface Condition {
  leftVariable: string
  op: '<' | '>' | '<=' | '>=' | '=='
  /** Numeric literal threshold, or another variable name prefixed with "var:". */
  right: number | string
}

export type BlockNode =
  | { id: string; type: 'read-sensor'; sensor: SensorKind; variable: string }
  | {
      id: string
      type: 'if-else'
      condition: Condition
      then: BlockNode[]
      else: BlockNode[]
    }
  | { id: string; type: 'set-output'; targetId: string; state: 'on' | 'off' }
  | { id: string; type: 'delay'; ms: number }

export interface BlockProgram {
  loop: BlockNode[]
}

/* -------------------------------- Project --------------------------------- */

export interface GeneratedCode {
  content: string
  /** true while code is a pure reflection of the block program. */
  syncedFromBlocks: boolean
}

export interface TestResultSummary {
  runAt: number
  passed: number
  total: number
}

export interface ProjectFlags {
  simulatedAt?: number
}

export interface NanoProject {
  id: string
  name: string
  templateId: string | null
  createdAt: number
  updatedAt: number
  boardId: string
  circuit: CircuitData
  blocks: BlockProgram
  code: GeneratedCode
  notes: string
  lastTestResults?: TestResultSummary
  flags: ProjectFlags
}

/* --------------------------------- Boards --------------------------------- */

export interface BoardDefinition {
  id: string
  name: string
  vendor: string
  description: string
  learn: string
  icon: string
  color: string
  voltageLogic: number
  pins: PinDefinition[]
  componentDefId: string
}

/* -------------------------------- Templates ------------------------------- */

export interface TestCase {
  id: string
  name: string
  lightLevel: number // 0..100 %
  expectLed: 'on' | 'off'
  explanation: string
}

export interface ProjectTemplate {
  id: string
  title: string
  emoji: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  level: 'Spark Discover' | 'Spark Create' | 'Spark Innovate'
  boardId: string
  blurb: string
  learning: string[]
  componentsUsed: string[]
  build: () => { circuit: CircuitData; blocks: BlockProgram; name: string }
  tests: TestCase[]
}

/* ------------------------------- Validation ------------------------------- */

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface Issue {
  id: string
  severity: IssueSeverity
  title: string
  why?: string
  fix?: string
  relatedComponentId?: string
}

/* ------------------------------- Simulation ------------------------------- */

export interface ConsoleEntry {
  id: number
  level: 'log' | 'info' | 'warn' | 'error'
  text: string
  time: string
}

export interface SerialLine {
  id: number
  time: string
  text: string
}

export interface SimEnvironment {
  lightLevel: number // % for LDR
  knobLevel: number // % for potentiometer
}

export interface SimState {
  iteration: number
  virtualMs: number
  variables: Record<string, number>
  outputs: Record<string, boolean> // placed component id -> driven HIGH?
  serialLog: SerialLine[]
}

/* -------------------------------- Hardware -------------------------------- */

export interface DetectedBoard {
  id: string
  name: string
  port: string
}

export interface BuildResult {
  ok: boolean
  message: string
}

export interface UploadResult {
  ok: boolean
  message: string
}
