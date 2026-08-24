import type { BlockNode } from '../../types/nano'

/** Immutable helpers for editing the block program tree. */

export function cloneNodes(nodes: BlockNode[]): BlockNode[] {
  return JSON.parse(JSON.stringify(nodes)) as BlockNode[]
}

export function findAndTransform(
  nodes: BlockNode[],
  id: string,
  fn: (node: BlockNode) => BlockNode,
): BlockNode[] {
  return nodes.map((node) => {
    if (node.id === id) return fn(node)
    if (node.type === 'if-else') {
      return {
        ...node,
        then: findAndTransform(node.then, id, fn),
        else: findAndTransform(node.else, id, fn),
      }
    }
    return node
  })
}

export function removeFromTree(
  nodes: BlockNode[],
  id: string,
): { nodes: BlockNode[]; removed: boolean } {
  let removed = false
  const result: BlockNode[] = []
  for (const node of nodes) {
    if (node.id === id) {
      removed = true
      continue
    }
    if (node.type === 'if-else') {
      const thenRes = removeFromTree(node.then, id)
      const elseRes = removeFromTree(node.else, id)
      result.push({
        ...node,
        then: thenRes.nodes,
        else: elseRes.nodes,
      })
      removed = removed || thenRes.removed || elseRes.removed
    } else {
      result.push(node)
    }
  }
  return { nodes: result, removed }
}

export function moveInList(nodes: BlockNode[], id: string, delta: -1 | 1): BlockNode[] {
  const index = nodes.findIndex((n) => n.id === id)
  if (index === -1) {
    return nodes.map((n) =>
      n.type === 'if-else'
        ? { ...n, then: moveInList(n.then, id, delta), else: moveInList(n.else, id, delta) }
        : n,
    )
  }
  const target = index + delta
  if (target < 0 || target >= nodes.length) return nodes
  const copy = [...nodes]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item)
  return copy
}

export function appendToBranch(
  nodes: BlockNode[],
  ifId: string,
  branch: 'then' | 'else',
  node: BlockNode,
): BlockNode[] {
  return nodes.map((n) => {
    if (n.id === ifId && n.type === 'if-else') {
      return { ...n, [branch]: [...n[branch], node] }
    }
    if (n.type === 'if-else') {
      return {
        ...n,
        then: appendToBranch(n.then, ifId, branch, node),
        else: appendToBranch(n.else, ifId, branch, node),
      }
    }
    return n
  })
}

/** Every sensor variable declared anywhere in the program. */
export function collectVariables(nodes: BlockNode[], into: string[] = []): string[] {
  for (const node of nodes) {
    if (node.type === 'read-sensor' && !into.includes(node.variable)) into.push(node.variable)
    if (node.type === 'if-else') {
      collectVariables(node.then, into)
      collectVariables(node.else, into)
    }
  }
  return into
}

let blockSeq = 0
export function newBlockId(): string {
  blockSeq += 1
  return `blk-${Date.now().toString(36)}-${blockSeq}`
}
