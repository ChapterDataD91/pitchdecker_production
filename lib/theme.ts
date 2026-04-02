// ---------------------------------------------------------------------------
// Design tokens for programmatic access (Framer Motion, charts, etc.)
// Source of truth: globals.css @theme block
// Reference: .claude/skills/design-system/SKILL.md
// ---------------------------------------------------------------------------

export const theme = {
  colors: {
    // Background
    bg: '#FFFFFF',
    bgSubtle: '#FAFAFA',
    bgMuted: '#F5F5F5',
    bgHover: '#F0F0F0',
    bgActive: '#E8F0FE',

    // Text
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textPlaceholder: '#D1D5DB',

    // Borders
    border: '#E5E7EB',
    borderSubtle: '#F3F4F6',
    borderStrong: '#D1D5DB',

    // Accent — blue
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentLight: '#EFF6FF',
    accentMuted: '#DBEAFE',

    // Status
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    error: '#DC2626',
    errorLight: '#FEF2F2',

    // Functional (tags, categories, grouping) — bg + fg pairs
    functional: {
      sand: { bg: '#F5F0EB', fg: '#78716C' },
      sage: { bg: '#ECFDF5', fg: '#047857' },
      rose: { bg: '#FFF1F2', fg: '#BE123C' },
      lilac: { bg: '#F3F0FF', fg: '#6D28D9' },
      slate: { bg: '#F1F5F9', fg: '#475569' },
      sienna: { bg: '#FEF3C7', fg: '#92400E' },
      teal: { bg: '#F0FDFA', fg: '#0F766E' },
      copper: { bg: '#FFF7ED', fg: '#C2410C' },
    },
  },

  animation: {
    curves: {
      content: 'cubic-bezier(0.16, 1, 0.3, 1)',   // spring-like
      slideOut: 'cubic-bezier(0.32, 0.72, 0, 1)',  // smooth ease-out
      fade: 'cubic-bezier(0.4, 0, 0.2, 1)',        // standard ease
    },
    durations: {
      micro: 150,
      layout: 200,
      overlay: 300,
    },
  },

  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
  },

  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
    overlay: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)',
  },
} as const

export type Theme = typeof theme

// ---------------------------------------------------------------------------
// Section metadata — defines the 11 canonical deck sections
// ---------------------------------------------------------------------------

export const SECTIONS = [
  { id: 'cover', label: 'Cover', description: 'Introduction & hero image', order: 1 },
  { id: 'team', label: 'Team', description: 'Search team composition', order: 2 },
  { id: 'searchProfile', label: 'Search Profile', description: 'Must-haves & nice-to-haves', order: 3 },
  { id: 'salary', label: 'Salary', description: 'Compensation package', order: 4 },
  { id: 'credentials', label: 'Credentials', description: 'Relevant track record', order: 5 },
  { id: 'timeline', label: 'Timeline', description: 'Process & milestones', order: 6 },
  { id: 'assessment', label: 'Assessment', description: 'Evaluation methodology', order: 7 },
  { id: 'personas', label: 'Personas', description: 'Candidate archetypes', order: 8 },
  { id: 'scorecard', label: 'Scorecard', description: 'Weighted criteria', order: 9 },
  { id: 'candidates', label: 'Candidates', description: 'Sample shortlist', order: 10 },
  { id: 'fee', label: 'Fee Proposal', description: 'Pricing & terms', order: 11 },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
