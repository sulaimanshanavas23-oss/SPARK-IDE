/* Engine smoke test: Automatic Night Lamp must pass its own test suite. */
import { instantiateTemplate } from '../src/data/projects'
import { generateCode } from '../src/engine/blocks/codegen'
import { runTests } from '../src/engine/tests/runner'
import { validateProject } from '../src/engine/circuit/validation'
import { TEMPLATE_MAP } from '../src/data/projects'

const template = TEMPLATE_MAP['automatic-night-lamp']
const built = instantiateTemplate('automatic-night-lamp', 'guided')!

const project = {
  id: 'x',
  name: built.name,
  templateId: template.id,
  createdAt: 0,
  updatedAt: 0,
  boardId: 'arduino-uno',
  circuit: built.circuit,
  blocks: built.blocks,
  code: { content: '', syncedFromBlocks: true },
  notes: '',
  flags: {},
}

const report = validateProject(project)
console.log('validation:', JSON.stringify(report))
if (report.errors > 0) throw new Error('expected zero errors for guided build')

const gen = generateCode(project)
project.code.content = gen.code
console.log('--- generated code ---')
console.log(gen.code)

const tests = runTests(project, template.tests)
for (const o of tests.outcomes) {
  console.log(`${o.case.name}: light=${o.case.lightLevel}% expected=${o.case.expectLed} got=${o.actualLed} -> ${o.passed ? 'PASS' : 'FAIL'}`)
}
if (tests.passed !== tests.total || tests.total !== 2) throw new Error('tests did not fully pass')
console.log('SMOKE OK')
