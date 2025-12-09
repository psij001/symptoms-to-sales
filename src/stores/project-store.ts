import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, VoiceDNA, OfferContext, ProjectWithContext } from '@/types/database'

interface ProjectState {
  // Current active project and its context
  activeProject: ProjectWithContext | null
  activeVoiceDNA: VoiceDNA | null
  activeOfferContext: OfferContext | null

  // All user's projects
  projects: Project[]

  // Actions
  setActiveProject: (project: ProjectWithContext) => void
  setProjects: (projects: Project[]) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  clearActiveProject: () => void

  // Context actions
  setActiveVoiceDNA: (voiceDNA: VoiceDNA | null) => void
  setActiveOfferContext: (offerContext: OfferContext | null) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      activeProject: null,
      activeVoiceDNA: null,
      activeOfferContext: null,
      projects: [],

      setActiveProject: (project) => {
        // Find the active voice DNA and offer context
        const activeVoiceDNA = project.voice_dna?.find((v) => v.is_active) ?? project.voice_dna?.[0] ?? null
        const activeOfferContext = project.offer_contexts?.find((o) => o.is_active) ?? project.offer_contexts?.[0] ?? null

        set({
          activeProject: project,
          activeVoiceDNA,
          activeOfferContext,
        })
      },

      setProjects: (projects) => set({ projects }),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          activeProject:
            state.activeProject?.id === id
              ? { ...state.activeProject, ...updates }
              : state.activeProject,
        })),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProject: state.activeProject?.id === id ? null : state.activeProject,
        })),

      clearActiveProject: () =>
        set({
          activeProject: null,
          activeVoiceDNA: null,
          activeOfferContext: null,
        }),

      setActiveVoiceDNA: (voiceDNA) => set({ activeVoiceDNA: voiceDNA }),

      setActiveOfferContext: (offerContext) => set({ activeOfferContext: offerContext }),
    }),
    {
      name: 's2s-project-store',
      // Only persist the active project ID, not the full object
      partialize: (state) => ({
        activeProjectId: state.activeProject?.id,
      }),
    }
  )
)
