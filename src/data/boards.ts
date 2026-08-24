import type { BoardDefinition } from '../types/nano'

function digitalPins(): BoardDefinition['pins'] {
  const pins = []
  for (let n = 0; n <= 13; n++) {
    pins.push({
      id: `D${n}`,
      name: `D${n}`,
      kind: 'digital' as const,
      hint: n === 0 || n === 1 ? `Shared with USB serial — avoid if possible` : `Digital pin ${n}`,
      })
  }
  return pins
}

const analogNames = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']

export const BOARDS: Record<string, BoardDefinition> = {
  'arduino-uno': {
    id: 'arduino-uno',
    componentDefId: 'board-uno',
    name: 'Arduino UNO',
    vendor: 'Arduino',
    description:
      'The classic beginner microcontroller board. 14 digital pins, 6 analog inputs, 5 V logic.',
    learn:
      'The Arduino UNO runs one program at a time inside loop(). Its analog inputs (A0–A5) read voltages from 0–5 V as numbers 0–1023, and its digital pins can switch things like LEDs on (HIGH) or off (LOW).',
    icon: '🧠',
    color: '#00979d',
    voltageLogic: 5,
    pins: [
      { id: '5V', name: '5V', kind: 'power-5v', hint: 'Regulated 5 V supply output' },
      { id: '3V3', name: '3V3', kind: 'power-3v3', hint: '3.3 V supply output' },
      { id: 'GND.1', name: 'GND', kind: 'ground', hint: 'Ground — the return path every circuit needs' },
      { id: 'GND.2', name: 'GND', kind: 'ground', hint: 'Second ground pin' },
      { id: 'VIN', name: 'VIN', kind: 'power-5v', hint: 'Raw input voltage from barrel jack' },
      ...analogNames.map((name) => ({
        id: name,
        name,
        kind: 'analog' as const,
        hint: `${name} — analog input, reads 0–1023`,
      })),
      ...digitalPins(),
    ],
  },
}

export function getBoard(id: string | null | undefined): BoardDefinition | undefined {
  if (!id) return undefined
  return BOARDS[id]
}
