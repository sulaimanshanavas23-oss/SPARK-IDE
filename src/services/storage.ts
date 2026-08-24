import type { NanoProject } from '../types/nano'

const STORAGE_KEY = 'nano-spark-studio-v1'

interface StoredShape {
  projects: NanoProject[]
  activeProjectId: string | null
}

export function loadStudio(): StoredShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredShape>
      if (Array.isArray(parsed.projects)) {
        return {
          projects: parsed.projects,
          activeProjectId: parsed.activeProjectId ?? null,
        }
      }
    }
  } catch {
    // corrupted storage → fall through to defaults
  }
  return { projects: [], activeProjectId: null }
}

export function saveStudio(shape: StoredShape): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shape))
  } catch {
    // storage full / unavailable — autosave silently skips this tick
  }
}
