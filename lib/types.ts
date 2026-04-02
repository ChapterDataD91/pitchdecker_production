// ---------------------------------------------------------------------------
// Type definitions for PitchDecker — executive search pitch deck builder
// Source of truth: .claude/skills/data-dictionary/SKILL.md
// ---------------------------------------------------------------------------

import type { SectionId } from './theme'

// ---------------------------------------------------------------------------
// Shared enums / unions
// ---------------------------------------------------------------------------

export type SectionStatus = 'empty' | 'in-progress' | 'complete'

export type DeckStatus = 'draft' | 'in-progress' | 'complete'

export type FeeStructure = 'retainer' | 'contingency' | 'hybrid'

export type AssessmentMethodType =
  | 'behavioral-interview'
  | 'case-study'
  | 'psychometric'
  | 'reference-check'
  | 'competency-assessment'
  | 'presentation'

export type Weight = 1 | 2 | 3 | 4 | 5

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------

export interface CoverStats {
  criteriaCount: number
  timelineWeeks: number
  candidateCount: number
}

export interface CoverSection {
  clientName: string
  roleTitle: string
  introParagraph: string
  heroImageUrl: string
  stats: CoverStats
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string
  name: string
  title: string
  photoUrl: string
  bio: string
  expertiseTags: string[]
}

export interface TeamSection {
  leadTeam: TeamMember[]
  network: TeamMember[]
}

// ---------------------------------------------------------------------------
// Search Profile
// ---------------------------------------------------------------------------

export interface Criterion {
  id: string
  text: string
  weight: Weight
}

export interface SearchProfileSection {
  mustHaves: Criterion[]
  niceToHaves: Criterion[]
}

// ---------------------------------------------------------------------------
// Salary
// ---------------------------------------------------------------------------

export interface SalarySection {
  baseLow: number
  baseHigh: number
  bonus: string
  ltip: string
  benefits: string
  other: string
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface Placement {
  id: string
  role: string
  company: string
  industry: string
  year: number
  description: string
}

export interface CredentialAxis {
  id: string
  name: string
  description: string
  color: string
  intro: string
  placements: Placement[]
}

export interface CredentialsSection {
  axes: CredentialAxis[]
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface TimelinePhase {
  id: string
  name: string
  description: string
  durationWeeks: number
  milestones: string[]
  order: number
}

export interface TimelineSection {
  phases: TimelinePhase[]
  totalWeeks: number
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export interface AssessmentMethod {
  id: string
  type: AssessmentMethodType
  name: string
  description: string
  enabled: boolean
}

export interface AssessmentSection {
  methods: AssessmentMethod[]
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export interface Persona {
  id: string
  name: string
  description: string
  characteristics: string[]
  color: string
}

export interface PersonasSection {
  archetypes: Persona[]
}

// ---------------------------------------------------------------------------
// Scorecard
// ---------------------------------------------------------------------------

export interface ScorecardCriterion {
  id: string
  text: string
  weight: Weight
}

export interface ScorecardSection {
  mustHaves: ScorecardCriterion[]
  niceToHaves: ScorecardCriterion[]
  leadership: ScorecardCriterion[]
  successFactors: ScorecardCriterion[]
}

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

export interface CandidateScore {
  criterionId: string
  score: number
}

export interface Candidate {
  id: string
  name: string
  photoUrl: string
  currentCompany: string
  currentRole: string
  age: number
  summary: string
  archetypeTag: string
  scores: CandidateScore[]
  overallScore: number
  ranking: number
}

export interface CandidatesSection {
  candidates: Candidate[]
}

// ---------------------------------------------------------------------------
// Fee Proposal
// ---------------------------------------------------------------------------

export interface PaymentMilestone {
  id: string
  label: string
  percentage: number
  description: string
}

export interface FeeSection {
  feeStructure: FeeStructure
  feePercentage: number
  paymentMilestones: PaymentMilestone[]
  exclusivityTerms: string
  guaranteePeriod: string
}

// ---------------------------------------------------------------------------
// Deck sections map
// ---------------------------------------------------------------------------

export interface DeckSections {
  cover: CoverSection
  team: TeamSection
  searchProfile: SearchProfileSection
  salary: SalarySection
  credentials: CredentialsSection
  timeline: TimelineSection
  assessment: AssessmentSection
  personas: PersonasSection
  scorecard: ScorecardSection
  candidates: CandidatesSection
  fee: FeeSection
}

// ---------------------------------------------------------------------------
// Section status tracking
// ---------------------------------------------------------------------------

export type SectionStatuses = Record<SectionId, SectionStatus>

// ---------------------------------------------------------------------------
// Deck (full document)
// ---------------------------------------------------------------------------

export interface Deck {
  id: string
  clientName: string
  roleTitle: string
  createdAt: string
  updatedAt: string
  status: DeckStatus
  sectionStatuses: SectionStatuses
  sections: DeckSections
}

// ---------------------------------------------------------------------------
// Deck summary (dashboard list view)
// ---------------------------------------------------------------------------

export interface DeckSummary {
  id: string
  clientName: string
  roleTitle: string
  status: DeckStatus
  completedSections: number
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Factory — creates a properly shaped empty deck
// ---------------------------------------------------------------------------

export function createEmptyDeck(
  id: string,
  clientName: string,
  roleTitle: string,
): Deck {
  const now = new Date().toISOString()

  const emptySectionStatuses: SectionStatuses = {
    cover: 'empty',
    team: 'empty',
    searchProfile: 'empty',
    salary: 'empty',
    credentials: 'empty',
    timeline: 'empty',
    assessment: 'empty',
    personas: 'empty',
    scorecard: 'empty',
    candidates: 'empty',
    fee: 'empty',
  }

  const emptySections: DeckSections = {
    cover: {
      clientName,
      roleTitle,
      introParagraph: '',
      heroImageUrl: '',
      stats: {
        criteriaCount: 0,
        timelineWeeks: 0,
        candidateCount: 0,
      },
    },
    team: {
      leadTeam: [],
      network: [],
    },
    searchProfile: {
      mustHaves: [],
      niceToHaves: [],
    },
    salary: {
      baseLow: 0,
      baseHigh: 0,
      bonus: '',
      ltip: '',
      benefits: '',
      other: '',
    },
    credentials: {
      axes: [],
    },
    timeline: {
      phases: [],
      totalWeeks: 0,
    },
    assessment: {
      methods: [],
    },
    personas: {
      archetypes: [],
    },
    scorecard: {
      mustHaves: [],
      niceToHaves: [],
      leadership: [],
      successFactors: [],
    },
    candidates: {
      candidates: [],
    },
    fee: {
      feeStructure: 'retainer',
      feePercentage: 0,
      paymentMilestones: [],
      exclusivityTerms: '',
      guaranteePeriod: '',
    },
  }

  return {
    id,
    clientName,
    roleTitle,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    sectionStatuses: emptySectionStatuses,
    sections: emptySections,
  }
}
