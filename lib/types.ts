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

// Legacy union — preserved for documentation; not used by FeeSection anymore.
// Top of Minds works with flat-fee retainer; the union is kept exported in
// case other code (or a future white-label) wants to surface "structure".
export type FeeStructure = 'retainer' | 'contingency' | 'hybrid'

export type Weight = 1 | 2 | 3 | 4 | 5

/**
 * @deprecated Hogan-specific pillar keys are content presets, not type constraints.
 * Kept exported for the AssessmentEditor's "Apply Hogan template" button. New code
 * should treat AssessmentPillar.key as a free-form string.
 */
export type HoganPillarKey = 'HPI' | 'HDS' | 'MVPI'

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
  /** Short tagline shown beneath the hero title (1–2 sentences). */
  tagline?: string
  /** Longer paragraph rendered in the dedicated intro section below the hero banner. */
  introParagraph: string
  heroImageUrl: string
  /** Square logo of the client (renders in the hero left-side and again in the intro section). Optional; falls back to a navy block when absent. */
  clientLogoUrl?: string
  /** Wide banner image displayed full-width below the hero. Optional; section omits the band if absent. */
  bannerImageUrl?: string
  stats: CoverStats
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string
  algoliaId: string
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
// Algolia consultant data (used by /api/consultants)
// ---------------------------------------------------------------------------

export interface AlgoliaConsultant {
  objectID: string
  title: string
  name: string
  surname: string
  function: string
  email: string
  image: string
  quote: string
  linkedIn: string
  sectors: string[]
  functionalAreas: string[]
  teams: number[]
  plateId: number
}

export interface ConsultantSummary {
  id: string
  name: string
  role: string
  photoUrl: string
  bio: string
  sectors: string[]
  functionalAreas: string[]
}

// ---------------------------------------------------------------------------
// Search Profile
// ---------------------------------------------------------------------------

export interface Criterion {
  id: string
  text: string
  weight: Weight
}

export interface PersonalityProfile {
  intro: string
  traits: string[]
}

export interface SearchProfileSection {
  mustHaves: Criterion[]
  niceToHaves: Criterion[]
  personalityProfile: PersonalityProfile
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
  context: string
  // Optional metadata
  industry?: string
  year?: number
  description?: string
  // Enrichment / foreign keys
  placementId?: string
  companyUrl?: string
}

export interface CredentialAxis {
  id: string
  name: string
  description: string
  color: string
  intro: string
  contextLabel: string
  placements: Placement[]
}

export interface CredentialsSection {
  axes: CredentialAxis[]
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** Active phase = numbered, runs the search forward.
 *  Holiday phase = dashed placeholder block (e.g. summer break, year-end). */
export type TimelinePhaseKind = 'active' | 'holiday'

export interface TimelinePhase {
  id: string
  name: string
  description: string
  durationWeeks: number
  milestones: string[]
  order: number
  /** Renders as a dashed placeholder when 'holiday'. Defaults to 'active'. */
  kind?: TimelinePhaseKind
  /** Optional human-readable week range, e.g. "Week 1–2". Falls back to derived "Week N–M" if absent. */
  weekRangeLabel?: string
}

export interface TimelineSection {
  phases: TimelinePhase[]
  totalWeeks: number
  /** Free-text confidentiality / process note rendered as a sand .gd block at the end. */
  confidentialityNote?: string
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export interface AssessmentAssessor {
  name: string
  title: string
  photoUrl: string
  bio: string
}

export interface AssessmentPillar {
  /** Free-form short identifier (e.g. "HPI", "HDS", "MVPI" for Hogan). */
  key: string
  label: string
  description: string
}

/** Optional CTA shown beneath the pillar block (e.g. link to a sample report). */
export interface AssessmentCta {
  url: string
  label: string
}

/** Optional priced add-on for assessing the existing management team. */
export interface AssessmentMtBlock {
  enabled: boolean
  description: string
  amount: number
  ctaUrl: string
  ctaLabel: string
}

export interface AssessmentSection {
  assessor: AssessmentAssessor
  /** Display name of the assessment provider, e.g. "Hogan", "SHL". */
  providerName: string
  pillars: AssessmentPillar[]
  processDescription: string
  purposes: string[]
  costsNote: string
  /** Optional CTA card linking to a sample individual report. */
  sampleReport?: AssessmentCta | null
  /** Optional MT (management-team) assessment add-on block. */
  mtAssessment?: AssessmentMtBlock | null
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export type PersonaPoolSize = 'narrow' | 'moderate' | 'strong'

export interface Persona {
  id: string
  title: string
  description: string
  poolSize: PersonaPoolSize
  poolRangeLabel: string
  poolRationale: string
  order: number
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
  rationale?: string
}

export interface CareerEntry {
  id: string
  period: string
  role: string
  company: string
  highlights: string[]
}

export interface EducationEntry {
  id: string
  period: string
  degree: string
  institution: string
}

export type CandidateStatus = 'parsing' | 'parsed' | 'scored' | 'error'

export interface Candidate {
  id: string
  name: string
  photoUrl: string
  currentCompany: string
  currentRole: string
  age: number
  summary: string
  archetypeTag: string
  personaId: string | null
  scores: CandidateScore[]
  overallScore: number
  ranking: number
  status?: CandidateStatus
  cvFileName?: string
  rawCvText?: string
  careerHistory?: CareerEntry[]
  education?: EducationEntry[]
  languages?: string[]
  linkedinUrl?: string
  parseError?: string
  /** Bullet list of standout positives surfaced after assessment. */
  strengths?: string[]
  /** Bullet list of risks / development areas surfaced after assessment. */
  risks?: string[]
}

export interface CandidatesSection {
  candidates: Candidate[]
  /** GDPR / hard-factors gate explanatory note shown above the candidate grid. */
  hardFactorsGateNote?: string
}

// ---------------------------------------------------------------------------
// Fee Proposal
// ---------------------------------------------------------------------------

/** A single instalment in the fee schedule. The amount is implicit: the total
 *  fee is split equally across all instalments unless future work introduces
 *  a per-instalment override. */
export interface FeeInstalment {
  id: string
  /** Short label, e.g. "Engagement", "Shortlist", "Placement" */
  label: string
  /** Trigger phrase, e.g. "at engagement", "upon shortlist presentation" */
  trigger: string
}

/** An optional priced add-on (e.g. management-team assessment). */
export interface FeeAddon {
  id: string
  label: string
  amount: number
  description: string
}

export interface FeeSection {
  /** Flat fee amount in `currency` units (e.g. 100000 = €100,000) */
  amount: number
  /** ISO 4217 currency code, default 'EUR' */
  currency: string
  /** VAT/tax disclaimer, e.g. "excl. VAT" */
  vatNote: string
  /** Schedule of instalments. Empty → fee is paid in a single sum. */
  instalments: FeeInstalment[]
  /** Replacement guarantee window in months. 0 = no guarantee. */
  guaranteeMonths: number
  /** Free-text guarantee description (rendered after the guarantee header). */
  guaranteeNote: string
  /** Optional priced add-ons (e.g. MT assessment). */
  addons: FeeAddon[]
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
      tagline: '',
      introParagraph: '',
      heroImageUrl: '',
      clientLogoUrl: '',
      bannerImageUrl: '',
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
      personalityProfile: {
        intro: '',
        traits: [],
      },
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
      confidentialityNote: '',
    },
    assessment: {
      assessor: {
        name: '',
        title: '',
        photoUrl: '',
        bio: '',
      },
      providerName: '',
      pillars: [],
      processDescription: '',
      purposes: [],
      costsNote: '',
      sampleReport: null,
      mtAssessment: null,
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
      hardFactorsGateNote: '',
    },
    fee: {
      amount: 0,
      currency: 'EUR',
      vatNote: 'excl. VAT',
      instalments: [],
      guaranteeMonths: 0,
      guaranteeNote: '',
      addons: [],
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
