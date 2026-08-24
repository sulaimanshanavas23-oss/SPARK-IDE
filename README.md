# NANO SPARK IDE

**Technology • Innovations • Solutions**

A browser-based STEM development environment where students design circuits,
build logic, program with blocks or real C/C++, simulate, test and debug —
before ever touching hardware.

> Design it digitally. Simulate virtually. Build physically.

```
DESIGN → CODE → SIMULATE → TEST → DEBUG → DEPLOY → COMPETE → INNOVATE
```

---

## Current milestone: MVP 1 — Automatic Night Lamp (end-to-end)

A student can genuinely:

1. Create a project from the **Automatic Night Lamp** template (guided or scratch)
2. See a pre-wired circuit — or drag their own **LDR, LED, resistors, rails**
3. Wire components on a real node/graph canvas
   *(drag, connect pins, delete wires, rotate, duplicate, rename, zoom, pan, undo/redo)*
4. Read the **Logic** flowchart generated from their program
5. Build the program with structured **Blocks** (read sensor / if-else / output / wait)
6. Watch **real Arduino C/C++ generate automatically** from blocks
7. Edit the code in **Monaco** (taking ownership disables auto-sync, honestly)
8. Run the built-in **simulator**: slide the room light, watch the lamp react,
   read the serial monitor
9. Execute the project's **test suite** (`light 80% → LED OFF`, `20% → LED ON`)
10. Get beginner-friendly **diagnostics** with WHY + FIX for detectable circuit/code issues
11. **Save** (auto), reload, duplicate, rename, reset-to-template

### Honest-scope notes

- The simulator is the **built-in MVP engine**: it executes block programs against a
  simplified component model. A Wokwi-class circuit simulator is planned; the engine
  is isolated behind `src/engine/simulation` to be replaced without UI changes.
- **Hardware upload does not exist yet.** The Deploy tab says so, exposes the
  `HardwareProvider` interface status, and offers `.ino` download instead.
  No fake "Upload Successful" buttons.

---

## Tech stack

React 19 · TypeScript · Vite · Monaco Editor · @xyflow/react (circuit canvas) ·
localStorage persistence (Supabase/PostgreSQL planned)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Dev server with HMR                        |
| `npm run build`       | Type-check + production build              |
| `npm run lint`        | oxlint                                     |
| `npm run verify:engines` | Headless engine tests (codegen/sim/tests/validation) |

## Architecture

```
src/
  types/nano.ts               # domain model: boards, components, circuits, blocks, projects
  data/
    boards.ts                 # BoardDefinition registry (Arduino UNO today; ESP32/Pico/STM32 later)
    components.ts             # ComponentDefinition library (data-driven, category-tagged)
    projects.ts               # guided templates + test suites
  engine/
    circuit/topology.ts       # net tracing through conductors → pin resolution (Plug & Play core)
    circuit/validation.ts     # Design Rule Checker + beginner diagnostics (WHY/FIX)
    blocks/treeOps.ts         # immutable block-program tree editing
    blocks/codegen.ts         # BlockProgram → readable Arduino C/C++
    blocks/logicLayout.ts     # block program → flowchart layout (Logic tab)
    simulation/engine.ts      # MVP simulator: executes block programs headlessly
    tests/runner.ts           # reusable test-case runner over the simulator
  services/
    storage.ts                # persistence (localStorage today)
    hardware.ts               # HardwareProvider interface + not-available provider
  state/studio.tsx            # app state: projects CRUD, autosave, navigation
  components/
    Shell.tsx  ui.tsx
    dashboard/  projects/
    workspace/{design,logic,blocks,code,simulate,test,deploy}/
scripts/
  smoke.ts                    # end-to-end engine verification
  scenarios.ts                # diagnostic regression scenarios
```

**Extending the platform = adding data**, e.g. a new board in `data/boards.ts`
or a new component in `data/components.ts`; engines and UI pick it up.

## Environment variables

None required yet. When Supabase/hardware bridges arrive, secrets go in `.env`
(never committed) and are documented here.

## Roadmap

- **MVP 2** — logic/mind-map editing (currently read-only view), richer blocks,
  external simulation integration, serial monitor parity
- **MVP 3** — ESP32 board def, Web Serial detection, real compile/upload provider
- **MVP 4** — teacher dashboard, classes, challenges, scoring, leaderboards
- **MVP 5** — IoT deployment, portfolio, AI mentor (hint-first, never silent edits)
