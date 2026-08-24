import type { BlockNode } from '../../types/nano'

/**
 * Layout engine for the Logic view.
 * Converts the block program into positioned flow boxes + arrows so students
 * see their program as the flowchart it represents.
 */

export interface FlowBox {
  id: string
  kind: 'start' | 'read' | 'if' | 'action' | 'delay'
  title: string
  subtitle?: string
  x: number
  y: number
  w: number
  h: number
}

export interface FlowArrow {
  fromId: string
  toId: string
  label?: string
}

export interface FlowLayout {
  boxes: FlowBox[]
  arrows: FlowArrow[]
  width: number
  height: number
}

const BOX_W = 200
const BOX_H = 56
const GAP_Y = 40
const BRANCH_GAP_X = 70

interface Ctx {
  boxes: FlowBox[]
  arrows: FlowArrow[]
}

function nodeToBox(node: BlockNode, xCenter: number, y: number): FlowBox {
  const base = { x: xCenter - BOX_W / 2, y, w: BOX_W, h: BOX_H }
  switch (node.type) {
    case 'read-sensor':
      return {
        ...base,
        id: node.id,
        kind: 'read',
        title: `READ ${node.sensor === 'light' ? 'LDR ☀️' : 'KNOB 🎛️'}`,
        subtitle: `${node.variable} = analog reading`,
      }
    case 'set-output': {
      const targetLabel = node.targetId.startsWith('@') ? 'LED' : ''
      void targetLabel
      return {
        ...base,
        id: node.id,
        kind: 'action',
        title: `LED ${node.state.toUpperCase()} ${node.state === 'on' ? '💡' : '⚫'}`,
      }
    }
    case 'delay':
      return { ...base, id: node.id, kind: 'delay', title: `WAIT ${node.ms} ms` }
    case 'if-else': {
      const right =
        typeof node.condition.right === 'number'
          ? String(node.condition.right)
          : String(node.condition.right).replace('var:', '')
      return {
        ...base,
        id: node.id,
        kind: 'if',
        h: BOX_H + 12,
        title: `${node.condition.leftVariable} ${node.condition.op} ${right} ?`,
        subtitle: 'YES ↙        ↘ NO',
      }
    }
  }
}

/** Lays out a straight run of nodes; returns entry and exit box ids. */
function layRun(
  ctx: Ctx,
  nodes: BlockNode[],
  xCenter: number,
  yStart: number,
): { entryId: string | null; exitId: string | null; endY: number } {
  let y = yStart
  let prevId: string | null = null
  let entryId: string | null = null

  for (const node of nodes) {
    if (node.type === 'if-else') {
      const condBox = nodeToBox(node, xCenter, y)
      ctx.boxes.push(condBox)
      if (prevId) ctx.arrows.push({ fromId: prevId, toId: condBox.id })
      else entryId = condBox.id

      // Branch columns.
      const branchTop = y + condBox.h + GAP_Y
      const yesX = xCenter - BOX_W / 2 - BRANCH_GAP_X - BOX_W / 2 - 20
      const noX = xCenter + BOX_W / 2 + BRANCH_GAP_X + 20

      const yesRun = layRun(ctx, node.then, yesX + BOX_W / 2, branchTop)
      const noRun = layRun(ctx, node.else, noX + BOX_W / 2, branchTop)

      if (yesRun.entryId) {
        ctx.arrows.push({ fromId: condBox.id, toId: yesRun.entryId, label: 'YES' })
        prevId = yesRun.exitId
      } else {
        prevId = condBox.id // empty branch: flow skips through
      }

      const mergeY = Math.max(yesRun.endY, noRun.endY, branchTop)
      const mergeBox: FlowBox = {
        id: `${node.id}-loop`,
        kind: 'delay',
        title: '↺ LOOP',
        subtitle: 'repeat forever',
        x: xCenter - BOX_W / 2,
        y: mergeY,
        w: BOX_W,
        h: 42,
      }
      ctx.boxes.push(mergeBox)
      if (yesRun.entryId && yesRun.exitId) ctx.arrows.push({ fromId: yesRun.exitId, toId: mergeBox.id })
      if (noRun.entryId) {
        ctx.arrows.push({ fromId: condBox.id, toId: noRun.entryId, label: 'NO' })
        if (noRun.exitId) ctx.arrows.push({ fromId: noRun.exitId, toId: mergeBox.id })
      }

      y = mergeY + mergeBox.h + GAP_Y
      prevId = mergeBox.id
      continue
    }

    const box = nodeToBox(node, xCenter, y)
    ctx.boxes.push(box)
    if (prevId) ctx.arrows.push({ fromId: prevId, toId: box.id })
    else entryId = box.id
    prevId = box.id
    y += box.h + GAP_Y
  }

  return { entryId, exitId: prevId, endY: y }
}

export function layoutFlow(loop: BlockNode[]): FlowLayout {
  const ctx: Ctx = { boxes: [], arrows: [] }

  const start: FlowBox = {
    id: '__start',
    kind: 'start',
    title: 'START ⚡',
    subtitle: 'board powers on',
    x: 0,
    y: 0,
    w: BOX_W,
    h: BOX_H,
  }
  ctx.boxes.push(start)

  const centerXGuess = 340
  const run = layRun(ctx, loop, centerXGuess, BOX_H + GAP_Y)
  if (run.entryId) ctx.arrows.unshift({ fromId: start.id, toId: run.entryId })

  // Normalise to positive space.
  const minX = Math.min(...ctx.boxes.map((b) => b.x)) - 24
  const minY = Math.min(...ctx.boxes.map((b) => b.y)) - 16
  let maxX = 0
  let maxY = 0
  for (const b of ctx.boxes) {
    b.x -= minX
    b.y -= minY
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }

  return {
    boxes: ctx.boxes,
    arrows: ctx.arrows,
    width: maxX + 30,
    height: maxY + 30,
  }
}
