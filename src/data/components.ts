import type { ComponentCategory, ComponentDefinition, PinKind, PinDefinition } from '../types/nano'

function pin(id: string, name: string, kind: PinKind, hint?: string): PinDefinition {
  return { id, name, kind, hint }
}

const ALL_BOARDS = ['arduino-uno']

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  /* ------------------------------- Boards -------------------------------- */
  {
    id: 'board-uno',
    name: 'Arduino UNO',
    category: 'board',
    description: 'Programmable microcontroller board — the brain of your project.',
    learn:
      'The UNO reads sensors on its analog pins (A0–A5) and controls outputs on its digital pins (D0–D13). Power pins in the corner provide 5 V and GND for your components.',
    icon: '🧠',
    color: '#00979d',
    supportedBoards: ALL_BOARDS,
    simulationType: 'none',
    pins: [
      pin('5V', '5V', 'power-5v'),
      pin('3V3', '3V3', 'power-3v3'),
      pin('GND.1', 'GND', 'ground'),
      pin('GND.2', 'GND', 'ground'),
      pin('VIN', 'VIN', 'power-5v'),
      ...['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map((n) => pin(n, n, 'analog')),
      ...Array.from({ length: 14 }, (_, i) => pin(`D${i}`, `D${i}`, 'digital')),
    ],
  },

  /* ------------------------------- Sensors ------------------------------- */
  {
    id: 'ldr',
    name: 'LDR (Light Sensor)',
    category: 'sensor',
    description: 'Photoresistor — its resistance drops when light shines on it.',
    learn:
      'An LDR changes resistance with light. Wired in a voltage divider with a fixed resistor, it produces a voltage the Arduino can read on an analog pin: bright light → high reading, darkness → low reading.',
    icon: '🔆',
    color: '#ffd166',
    supportedBoards: ALL_BOARDS,
    simulationType: 'analog-light-sensor',
    defaults: { seriesResistorOhms: 10000 },
    pins: [
      pin('SIG', 'SIG', 'signal', 'Divider output — connect to an analog input'),
      pin('VCC', 'VCC', 'power-5v', 'Connect to 5 V (through nothing — module side)'),
      pin('GND', 'GND', 'ground'),
    ],
  },
  {
    id: 'potentiometer',
    name: 'Potentiometer',
    category: 'input',
    description: 'Rotary knob — twist it to produce any voltage between 0 and 5 V.',
    learn:
      'A potentiometer is an adjustable voltage divider. The middle pin (wiper) gives a voltage you can read on an analog input — perfect for manual controls.',
    icon: '🎛️',
    color: '#c9a0ff',
    supportedBoards: ALL_BOARDS,
    simulationType: 'analog-knob',
    pins: [
      pin('VCC', 'VCC', 'power-5v'),
      pin('SIG', 'SIG', 'signal', 'Wiper — connect to an analog input'),
      pin('GND', 'GND', 'ground'),
    ],
  },
  {
    id: 'button',
    name: 'Push Button',
    category: 'input',
    description: 'Momentary switch — connects its two pins while pressed.',
    learn:
      'Buttons make or break a connection. With a pull-down resistor (or INPUT_PULLUP mode) the Arduino can tell pressed from released.',
    icon: '🔘',
    color: '#9aa7ff',
    supportedBoards: ALL_BOARDS,
    simulationType: 'button',
    pins: [pin('T1', 'T1', 'signal'), pin('T2', 'T2', 'signal')],
  },

  /* ------------------------------- Outputs ------------------------------- */
  {
    id: 'led',
    name: 'LED',
    category: 'output',
    description: 'Light-emitting diode — glows when current flows the right way.',
    learn:
      'An LED is a one-way valve for electricity. Current flows from the long leg (anode +) to the short leg (cathode −). Always use a resistor in series so the LED does not burn out.',
    icon: '💡',
    color: '#ff8a3d',
    supportedBoards: ALL_BOARDS,
    simulationType: 'led',
    pins: [
      pin('A', 'A (+)', 'signal', 'Anode — the long leg; current enters here'),
      pin('K', 'K (−)', 'ground', 'Cathode — the short leg; current leaves toward GND'),
    ],
  },
  {
    id: 'buzzer',
    name: 'Buzzer',
    category: 'output',
    description: 'Piezo buzzer — beeps when driven with a signal.',
    learn:
      'A piezo buzzer converts an electrical signal into sound. Drive it from a digital pin through a resistor to make tones or alerts.',
    icon: '🔔',
    color: '#6bd6a8',
    supportedBoards: ALL_BOARDS,
    simulationType: 'buzzer',
    pins: [pin('+', '+', 'signal'), pin('-', '−', 'ground')],
  },

  /* ------------------------------- Passives ------------------------------ */
  {
    id: 'resistor',
    name: 'Resistor',
    category: 'passive',
    description: 'Limits current flow. The guardian of every LED.',
    learn:
      'Resistance is measured in ohms (Ω). A 220 Ω resistor keeps a typical LED at a safe current. Resistors have no polarity — either way round works.',
    icon: '〰️',
    color: '#d7dde8',
    supportedBoards: ALL_BOARDS,
    simulationType: 'conductor',
    defaults: { ohms: 220 },
    pins: [pin('T1', 'T1', 'signal'), pin('T2', 'T2', 'signal')],
  },
  {
    id: 'breadboard',
    name: 'Breadboard',
    category: 'structure',
    description: 'Solderless prototyping board for arranging components.',
    learn:
      'Breadboards have rows of connected holes so you can build circuits without soldering. Power rails run along the sides; the middle columns connect in short groups.',
    icon: '🍞',
    color: '#f2ead8',
    supportedBoards: ALL_BOARDS,
    simulationType: 'none',
    pins: [],
  },

  /* -------------------------------- Power -------------------------------- */
  {
    id: 'rail-5v',
    name: '5V Rail',
    category: 'power',
    description: 'Junction node for distributing 5 V to several components.',
    learn:
      'Many components need the same supply. A rail node lets one 5 V wire branch out cleanly instead of stuffing three wires into one pin.',
    icon: '🔴',
    color: '#ff5f56',
    supportedBoards: ALL_BOARDS,
    simulationType: 'conductor',
    pins: [pin('P1', 'P1', 'power-5v'), pin('P2', 'P2', 'power-5v')],
  },
  {
    id: 'rail-gnd',
    name: 'GND Rail',
    category: 'power',
    description: 'Junction node for sharing ground across components.',
    learn:
      'Every circuit must return to ground. A shared GND rail keeps all component grounds connected — without it, nothing works.',
    icon: '⚫',
    color: '#8b94a7',
    supportedBoards: ALL_BOARDS,
    simulationType: 'conductor',
    pins: [pin('P1', 'P1', 'ground'), pin('P2', 'P2', 'ground')],
  },
]

export const COMPONENT_MAP: Record<string, ComponentDefinition> = Object.fromEntries(
  COMPONENT_DEFINITIONS.map((def) => [def.id, def]),
)

export function getComponentDef(defId: string): ComponentDefinition | undefined {
  return COMPONENT_MAP[defId]
}

export const PALETTE_CATEGORIES: Array<{ id: ComponentCategory; label: string }> = [
  { id: 'board', label: 'Boards' },
  { id: 'sensor', label: 'Sensors' },
  { id: 'output', label: 'Outputs' },
  { id: 'input', label: 'Inputs' },
  { id: 'passive', label: 'Components' },
  { id: 'power', label: 'Power' },
  { id: 'structure', label: 'Structure' },
]
