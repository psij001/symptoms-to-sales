import { create } from 'zustand'

type TriangleStep = 1 | 2 | 3

interface GenerationState {
  // ========================================
  // Triangle of Insight State
  // ========================================
  triangleStep: TriangleStep
  triangleInputs: {
    audience: string
    problem: string
  }
  symptoms: string[]
  selectedSymptom: string | null
  wisdoms: string[]
  selectedWisdom: string | null
  metaphors: string[]
  selectedMetaphor: string | null

  // ========================================
  // T1 Email State
  // ========================================
  emailType: string | null
  emailInputs: {
    audience: string
    problem: string
    mechanism: string
    callToAction: string
  }
  emailDrafts: string[]
  selectedDraft: number

  // ========================================
  // Subject Lines State
  // ========================================
  subjectLineInputs: {
    audience: string
    hellIsland: string
    additionalContext: string
  }
  subjectLines: string[]

  // ========================================
  // Common State
  // ========================================
  isGenerating: boolean
  streamingContent: string
  error: string | null

  // ========================================
  // Triangle Actions
  // ========================================
  setTriangleStep: (step: TriangleStep) => void
  setTriangleInputs: (inputs: Partial<GenerationState['triangleInputs']>) => void
  setSymptoms: (symptoms: string[]) => void
  setSelectedSymptom: (symptom: string) => void
  setWisdoms: (wisdoms: string[]) => void
  setSelectedWisdom: (wisdom: string) => void
  setMetaphors: (metaphors: string[]) => void
  setSelectedMetaphor: (metaphor: string) => void
  resetTriangle: () => void

  // ========================================
  // T1 Email Actions
  // ========================================
  setEmailType: (type: string) => void
  setEmailInputs: (inputs: Partial<GenerationState['emailInputs']>) => void
  setEmailDrafts: (drafts: string[]) => void
  setSelectedDraft: (index: number) => void
  resetEmail: () => void

  // ========================================
  // Subject Lines Actions
  // ========================================
  setSubjectLineInputs: (inputs: Partial<GenerationState['subjectLineInputs']>) => void
  setSubjectLines: (lines: string[]) => void
  resetSubjectLines: () => void

  // ========================================
  // Common Actions
  // ========================================
  setIsGenerating: (generating: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setError: (error: string | null) => void
  resetAll: () => void
}

const initialTriangleState = {
  triangleStep: 1 as TriangleStep,
  triangleInputs: { audience: '', problem: '' },
  symptoms: [],
  selectedSymptom: null,
  wisdoms: [],
  selectedWisdom: null,
  metaphors: [],
  selectedMetaphor: null,
}

const initialEmailState = {
  emailType: null,
  emailInputs: { audience: '', problem: '', mechanism: '', callToAction: '' },
  emailDrafts: [],
  selectedDraft: 0,
}

const initialSubjectLineState = {
  subjectLineInputs: { audience: '', hellIsland: '', additionalContext: '' },
  subjectLines: [],
}

const initialCommonState = {
  isGenerating: false,
  streamingContent: '',
  error: null,
}

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialTriangleState,
  ...initialEmailState,
  ...initialSubjectLineState,
  ...initialCommonState,

  // Triangle Actions
  setTriangleStep: (step) => set({ triangleStep: step }),
  setTriangleInputs: (inputs) =>
    set((state) => ({
      triangleInputs: { ...state.triangleInputs, ...inputs },
    })),
  setSymptoms: (symptoms) => set({ symptoms }),
  setSelectedSymptom: (symptom) => set({ selectedSymptom: symptom }),
  setWisdoms: (wisdoms) => set({ wisdoms }),
  setSelectedWisdom: (wisdom) => set({ selectedWisdom: wisdom }),
  setMetaphors: (metaphors) => set({ metaphors }),
  setSelectedMetaphor: (metaphor) => set({ selectedMetaphor: metaphor }),
  resetTriangle: () => set(initialTriangleState),

  // Email Actions
  setEmailType: (type) => set({ emailType: type }),
  setEmailInputs: (inputs) =>
    set((state) => ({
      emailInputs: { ...state.emailInputs, ...inputs },
    })),
  setEmailDrafts: (drafts) => set({ emailDrafts: drafts }),
  setSelectedDraft: (index) => set({ selectedDraft: index }),
  resetEmail: () => set(initialEmailState),

  // Subject Line Actions
  setSubjectLineInputs: (inputs) =>
    set((state) => ({
      subjectLineInputs: { ...state.subjectLineInputs, ...inputs },
    })),
  setSubjectLines: (lines) => set({ subjectLines: lines }),
  resetSubjectLines: () => set(initialSubjectLineState),

  // Common Actions
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  setError: (error) => set({ error }),
  resetAll: () =>
    set({
      ...initialTriangleState,
      ...initialEmailState,
      ...initialSubjectLineState,
      ...initialCommonState,
    }),
}))
