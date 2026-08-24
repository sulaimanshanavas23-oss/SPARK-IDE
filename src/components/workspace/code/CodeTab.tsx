import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { NanoProject } from '../../../types/nano'
import { useStudio } from '../../../state/studio'
import { generateCode } from '../../../engine/blocks/codegen'
import { Chip } from '../../ui'
import './monacoSetup'

export function CodeTab({ project }: { project: NanoProject }) {
  const studio = useStudio()
  const [copied, setCopied] = useState(false)
  const [confirmSync, setConfirmSync] = useState(false)

  // Regenerate silently when blocks change while code is synced.
  useEffect(() => {
    if (project.code.syncedFromBlocks) {
      const fresh = generateCode(project).code
      if (fresh !== project.code.content) {
        studio.updateCode(project.id, fresh, true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.blocks, project.circuit, project.code.syncedFromBlocks])

  const download = () => {
    const blob = new Blob([project.code.content], { type: 'text/x-arduino' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^\w-]+/g, '_')}.ino`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="code-tab">
      <div className="canvas-toolbar">
        <Chip tone={project.code.syncedFromBlocks ? 'good' : 'warn'}>
          {project.code.syncedFromBlocks ? 'auto-generated from blocks' : 'custom code (edited by you)'}
        </Chip>
        <span className="toolbar-hint dim">
          {project.code.syncedFromBlocks
            ? 'Edit anything below to take ownership — blocks will stop auto-syncing.'
            : 'Your edits are kept. Resync to discard them and follow the blocks again.'}
        </span>
        <span className="spacer" />
        {!project.code.syncedFromBlocks && !confirmSync && (
          <button type="button" onClick={() => setConfirmSync(true)}>
            ⟳ Sync from blocks
          </button>
        )}
        {confirmSync && (
          <>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setConfirmSync(false)
                studio.updateCode(project.id, generateCode(project).code, true)
              }}
            >
              Overwrite my edits
            </button>
            <button type="button" onClick={() => setConfirmSync(false)}>
              Cancel
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(project.code.content).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          {copied ? '✓ copied' : '⧉ Copy'}
        </button>
        <button type="button" onClick={download}>
          ⬇ .ino
        </button>
      </div>

      <div className="code-host">
        <Editor
          language="cpp"
          theme="vs-dark"
          value={project.code.content}
          onChange={(value) => studio.updateCode(project.id, value ?? '', false)}
          options={{
            fontSize: 13.5,
            minimap: { enabled: true, scale: 0.8 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            renderLineHighlight: 'all',
            padding: { top: 10 },
            wordBasedSuggestions: 'currentDocument',
          }}
        />
      </div>
    </div>
  )
}
