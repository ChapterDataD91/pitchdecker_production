// ---------------------------------------------------------------------------
// Output-template i18n strings (en / nl).
//
// SINGLE SOURCE OF TRUTH for every hardcoded, human-visible string in the
// published deck. Renderers resolve the bundle once at the top and pass it
// down. Keep this file pure data — no runtime logic.
//
// Dutch conventions used below:
// - Loanwords left in English where Top of Minds' own Dutch copy does:
//   must-have, nice-to-have, search (fee / team), scorecard, assessment,
//   credentials, fee, pool, LTI, first-year success factors (the phrase
//   itself is re-expressed as "Succesfactoren eerste jaar" where it reads
//   naturally; left in English when part of a defined term).
// - Sentence case for body copy, Title Case retained only inside proper
//   nouns and branded labels.
// ---------------------------------------------------------------------------

import type { Locale } from '@/lib/types'

export interface OutputStrings {
  // ----- Chrome (confidentiality bar, footer, meta) -------------------------
  confidentialityBar: string
  confidentialityFooter: string
  footerExecutiveSearch: string
  metaDescription: (clientName: string) => string
  fallbackProposal: string

  // ----- Hero ---------------------------------------------------------------
  heroBadge: string
  heroRoleFor: string // connective "for" in "<Role> for <Client>"
  heroRoleFallback: string
  heroClientFallback: string
  heroMetaWeightedCriteria: string
  heroMetaTimelineUnit: string // "weeks" / "weken" — sits inside the <b> with the number
  heroMetaTimelineSuffix: string // "total timeline" / "totale doorlooptijd" — after </b>
  heroMetaCandidateProfiles: string
  heroImagePlaceholder: string

  // ----- Accordion section titles ------------------------------------------
  sectionTitles: {
    team: string
    searchProfile: string
    salary: string
    credentials: string
    timeline: string
    assessment: string
    personas: string
    scorecard: string
    candidates: string
    fee: string
  }

  // ----- Team ---------------------------------------------------------------
  teamLead: string
  teamNetwork: string
  teamEmpty: string

  // ----- Search Profile -----------------------------------------------------
  spMustHaves: string
  spNiceToHaves: string
  spPersonalityProfile: string
  spCriteriaPlaceholder: string
  spEmpty: string

  // ----- Salary -------------------------------------------------------------
  salaryIndicativeSuffix: string
  salaryGrossPerYear: string
  salaryBase: string
  salaryBonus: string
  salaryLti: string
  salaryBenefits: string
  salaryOther: string
  salaryEmpty: string

  // ----- Credentials --------------------------------------------------------
  credRole: string
  credCompany: string
  credContextFallback: string
  credAxisFallback: (n: number) => string
  credAxisPlacementsEmpty: string
  credEmpty: string

  // ----- Timeline -----------------------------------------------------------
  tlWeekSingle: (n: number) => string
  tlWeekRange: (a: number, b: number) => string
  tlTotal: string
  tlWorkingWeek: string
  tlWorkingWeeks: string
  tlEmpty: string

  // ----- Assessment ---------------------------------------------------------
  asPurposesIntro: (n: number) => string
  asNotIncluded: string
  asEmpty: string
  asSampleReportBadge: string
  asSampleReportBody: string
  asMtBadge: string
  asMtInvestment: (amount: string) => string

  // ----- Personas -----------------------------------------------------------
  poolNarrow: string
  poolModerate: string
  poolStrong: string
  poolFallback: string
  personaUntitled: string
  personasLead: string
  personasEmpty: string

  // ----- Scorecard ----------------------------------------------------------
  scMustHaves: string
  scNiceToHaves: string
  scLeadership: string
  scSuccessFactors: string
  scHeader: (total: number, dimensions: string) => string
  scDimensions: (n: number) => string
  scColCriterion: string
  scColWeight: string
  scEmpty: string

  // ----- Candidates (list) --------------------------------------------------
  candHardFactsLabel: string
  candGdprDisclaimer: string
  candEmpty: string

  // ----- Fee ---------------------------------------------------------------
  feeEmpty: string
  feeSearchFee: string
  feeHeadlineEqualInstalments: (
    price: string,
    vat: string,
    numWord: string,
    triggers: string,
  ) => string
  feeHeadlineSingle: (price: string, vat: string) => string
  feeNumWord: (n: number) => string
  feeConjunction: string // "and" / "en"
  feeInstalmentFallback: string
  feeSpecialTerms: string
  feeGuarantee: string
  feeGuaranteeDefault: (window: string) => string
  feeMonth: string
  feeMonths: string
  feePctBasisFallback: string
  feePctOf: string // "of" in "30% of basis"
  feeOptionalPrefix: string

  // ----- Candidate profile page --------------------------------------------
  cpRoleAt: string // connective "at" in "<Role> at <Company>"
  cpHardFactorsScore: string
  cpCareerOverview: string
  cpColPeriod: string
  cpColRole: string
  cpColCompany: string
  cpColHighlights: string
  cpEducation: string
  cpLanguages: string
  cpScorecardHardOnly: string
  cpStrengths: string
  cpRisks: string
  cpNavBack: string
  cpNavPrev: string
  cpNavNext: string
  cpMetaDescription: string
  cpFallbackProposal: string
}

// ---------------------------------------------------------------------------
// English strings
// ---------------------------------------------------------------------------

const en: OutputStrings = {
  confidentialityBar: 'Strictly Confidential',
  confidentialityFooter: 'STRICTLY CONFIDENTIAL',
  footerExecutiveSearch: '— Executive Search',
  metaDescription: (c) =>
    `Strictly confidential executive search proposal${c ? ' for ' + c : ''}`,
  fallbackProposal: 'Proposal',

  heroBadge: 'Executive Search Proposal',
  heroRoleFor: 'for',
  heroRoleFallback: 'Role title',
  heroClientFallback: 'Client',
  heroMetaWeightedCriteria: 'weighted criteria',
  heroMetaTimelineUnit: 'weeks',
  heroMetaTimelineSuffix: 'total timeline',
  heroMetaCandidateProfiles: 'candidate profiles',
  heroImagePlaceholder: 'Hero image',

  sectionTitles: {
    team: 'Our Team for this search mandate',
    searchProfile: 'Search Profile: Must-Haves & Nice-to-Haves',
    salary: 'Expected Salary Package',
    credentials: 'Credentials',
    timeline: 'Process & Timeline',
    assessment: 'Assessment',
    personas: 'Three Candidate Personas',
    scorecard: 'Selection Scorecard',
    candidates: 'Sample Candidates',
    fee: 'Fee Proposal',
  },

  teamLead: 'Lead Team',
  teamNetwork: 'Building Upon Different Networks',
  teamEmpty: 'No team members added yet.',

  spMustHaves: 'Must-Haves',
  spNiceToHaves: 'Nice-to-Haves',
  spPersonalityProfile: 'Personality Profile',
  spCriteriaPlaceholder: 'None captured yet',
  spEmpty: 'No search profile captured yet.',

  salaryIndicativeSuffix: ' (indicative)',
  salaryGrossPerYear: 'gross per year',
  salaryBase: 'Base salary',
  salaryBonus: 'Annual bonus',
  salaryLti: 'Long-Term Incentive (LTI)',
  salaryBenefits: 'Benefits',
  salaryOther: 'Other',
  salaryEmpty: 'No salary details captured yet.',

  credRole: 'Role',
  credCompany: 'Company',
  credContextFallback: 'Context',
  credAxisFallback: (n) => `Axis ${n}`,
  credAxisPlacementsEmpty: 'No placements added to this axis yet.',
  credEmpty: 'No credential axes added yet.',

  tlWeekSingle: (n) => `Week ${n}`,
  tlWeekRange: (a, b) => `Weeks ${a}–${b}`,
  tlTotal: 'Total timeline:',
  tlWorkingWeek: 'working week',
  tlWorkingWeeks: 'working weeks',
  tlEmpty: 'No timeline phases added yet.',

  asPurposesIntro: (n) =>
    n === 2
      ? 'Assessment results serve two purposes:'
      : n === 3
        ? 'Assessment results serve three purposes:'
        : n === 4
          ? 'Assessment results serve four purposes:'
          : `Assessment results serve ${n} purposes:`,
  asNotIncluded: 'Assessment is not included in this deck.',
  asEmpty: 'No assessment details captured yet.',
  asSampleReportBadge: 'Sample Report',
  asSampleReportBody:
    'A standard assessment produces a comprehensive personality profile mapped against the competencies required for the role, resulting in an overall match percentage and targeted development recommendations.',
  asMtBadge: 'Optional: Management Team Assessment',
  asMtInvestment: (amount) =>
    `The investment for a full management team assessment is <strong>${amount}</strong>.`,

  poolNarrow: 'Narrow Pool',
  poolModerate: 'Moderate Pool',
  poolStrong: 'Strong Pool',
  poolFallback: 'Pool',
  personaUntitled: 'Untitled persona',
  personasLead:
    'Anonymised candidate personas illustrating the type of leader we expect to identify for this role.',
  personasEmpty: 'No persona archetypes added yet.',

  scMustHaves: 'Must-Haves',
  scNiceToHaves: 'Nice-to-Haves',
  scLeadership: 'Leadership & Personality',
  scSuccessFactors: 'First-Year Success Factors',
  scHeader: (total, dimensions) =>
    `We evaluate candidates on <strong>${total} weighted criteria</strong> across ${dimensions}, scored 1–5. Weight reflects relative importance.`,
  scDimensions: (n) =>
    n === 1
      ? 'one dimension'
      : n === 2
        ? 'two dimensions'
        : n === 3
          ? 'three dimensions'
          : `${n} dimensions`,
  scColCriterion: 'Criterion',
  scColWeight: 'Weight',
  scEmpty: 'No scorecard criteria added yet.',

  candHardFactsLabel: 'Scoring based on hard facts (CV)',
  candGdprDisclaimer:
    'In compliance with GDPR regulations, we share only publicly available information about candidates until we have their explicit consent for introduction. Due to the confidential nature of this search, no candidates have been approached at this stage.',
  candEmpty: 'No candidates added yet.',

  feeEmpty: 'No fee details captured yet.',
  feeSearchFee: 'Search fee',
  feeHeadlineEqualInstalments: (price, vat, numWord, triggers) =>
    `<p><strong>Search fee:</strong> The fee of ${price}${vat} is invoiced in ${numWord} equal instalments: ${triggers}.</p>`,
  feeHeadlineSingle: (price, vat) =>
    `<p><strong>Search fee:</strong> The fee of ${price}${vat}.</p>`,
  feeNumWord: (n) =>
    n === 2 ? 'two' : n === 3 ? 'three' : n === 4 ? 'four' : String(n),
  feeConjunction: 'and',
  feeInstalmentFallback: 'Instalment',
  feeSpecialTerms: 'Special terms',
  feeGuarantee: 'Guarantee',
  feeGuaranteeDefault: (window) =>
    `Free replacement search if the appointed candidate leaves the position within ${window}.`,
  feeMonth: 'month',
  feeMonths: 'months',
  feePctBasisFallback: 'first-year total compensation',
  feePctOf: 'of',
  feeOptionalPrefix: 'Optional — ',

  cpRoleAt: 'at',
  cpHardFactorsScore: 'Hard factors score',
  cpCareerOverview: 'Career Overview',
  cpColPeriod: 'Period',
  cpColRole: 'Role',
  cpColCompany: 'Company',
  cpColHighlights: 'Highlights',
  cpEducation: 'Education',
  cpLanguages: 'Languages',
  cpScorecardHardOnly: 'Scorecard — Hard Factors Only',
  cpStrengths: 'Strengths',
  cpRisks: 'Risks / Considerations',
  cpNavBack: '← Back to proposal',
  cpNavPrev: '← Previous',
  cpNavNext: 'Next →',
  cpMetaDescription: 'Confidential candidate profile',
  cpFallbackProposal: 'Proposal',
}

// ---------------------------------------------------------------------------
// Dutch strings — first-pass draft. Keeps English loanwords Top of Minds uses:
// must-have, nice-to-have, search, fee, scorecard, assessment, credentials,
// pool, LTI, highlights.
// ---------------------------------------------------------------------------

const nl: OutputStrings = {
  confidentialityBar: 'Strikt vertrouwelijk',
  confidentialityFooter: 'STRIKT VERTROUWELIJK',
  footerExecutiveSearch: '— Executive Search',
  metaDescription: (c) =>
    `Strikt vertrouwelijk executive search-voorstel${c ? ' voor ' + c : ''}`,
  fallbackProposal: 'Voorstel',

  heroBadge: 'Executive Search Proposal',
  heroRoleFor: 'voor',
  heroRoleFallback: 'Functietitel',
  heroClientFallback: 'Opdrachtgever',
  heroMetaWeightedCriteria: 'gewogen criteria',
  heroMetaTimelineUnit: 'weken',
  heroMetaTimelineSuffix: 'totale doorlooptijd',
  heroMetaCandidateProfiles: 'kandidaat-profielen',
  heroImagePlaceholder: 'Hero image',

  sectionTitles: {
    team: 'Ons team voor deze search',
    searchProfile: 'Search Profile: must-haves & nice-to-haves',
    salary: 'Verwachte beloning',
    credentials: 'Credentials',
    timeline: 'Proces & tijdlijn',
    assessment: 'Assessment',
    personas: "Drie kandidaat-persona's",
    scorecard: 'Scorecard',
    candidates: 'Voorbeeldkandidaten',
    fee: 'Fee-voorstel',
  },

  teamLead: 'Searchteam',
  teamNetwork: 'Via verschillende netwerken',
  teamEmpty: 'Nog geen teamleden toegevoegd.',

  spMustHaves: 'Must-Haves',
  spNiceToHaves: 'Nice-to-Haves',
  spPersonalityProfile: 'Persoonlijkheidsprofiel',
  spCriteriaPlaceholder: 'Nog niets vastgelegd',
  spEmpty: 'Nog geen search profile vastgelegd.',

  salaryIndicativeSuffix: ' (indicatief)',
  salaryGrossPerYear: 'bruto per jaar',
  salaryBase: 'Basissalaris',
  salaryBonus: 'Jaarbonus',
  salaryLti: 'Long-Term Incentive (LTI)',
  salaryBenefits: 'Secundaire arbeidsvoorwaarden',
  salaryOther: 'Overig',
  salaryEmpty: 'Nog geen salarisgegevens vastgelegd.',

  credRole: 'Functie',
  credCompany: 'Bedrijf',
  credContextFallback: 'Context',
  credAxisFallback: (n) => `Axis ${n}`,
  credAxisPlacementsEmpty: 'Nog geen plaatsingen toegevoegd aan deze axis.',
  credEmpty: 'Nog geen credentials-axes toegevoegd.',

  tlWeekSingle: (n) => `Week ${n}`,
  tlWeekRange: (a, b) => `Week ${a}–${b}`,
  tlTotal: 'Totale doorlooptijd:',
  tlWorkingWeek: 'werkweek',
  tlWorkingWeeks: 'werkweken',
  tlEmpty: 'Nog geen fases toegevoegd.',

  asPurposesIntro: (n) =>
    n === 2
      ? 'Assessmentresultaten dienen twee doelen:'
      : n === 3
        ? 'Assessmentresultaten dienen drie doelen:'
        : n === 4
          ? 'Assessmentresultaten dienen vier doelen:'
          : `Assessmentresultaten dienen ${n} doelen:`,
  asNotIncluded: 'Assessment is niet opgenomen in dit voorstel.',
  asEmpty: 'Nog geen assessment-details vastgelegd.',
  asSampleReportBadge: 'Voorbeeldrapport',
  asSampleReportBody:
    'Een standaardassessment levert een compleet persoonlijkheidsprofiel, afgezet tegen de competenties voor de functie, en resulteert in een totaal match-percentage en gerichte ontwikkelpunten.',
  asMtBadge: 'Optioneel: MT-assessment',
  asMtInvestment: (amount) =>
    `De investering voor een volledig MT-assessment bedraagt <strong>${amount}</strong>.`,

  poolNarrow: 'Smalle pool',
  poolModerate: 'Gemiddelde pool',
  poolStrong: 'Brede pool',
  poolFallback: 'Pool',
  personaUntitled: 'Persona zonder titel',
  personasLead:
    "Geanonimiseerde kandidaat-persona's die illustreren welk type leider we verwachten te identificeren voor deze rol.",
  personasEmpty: "Nog geen persona's toegevoegd.",

  scMustHaves: 'Must-Haves',
  scNiceToHaves: 'Nice-to-Haves',
  scLeadership: 'Leadership & persoonlijkheid',
  scSuccessFactors: 'Succesfactoren eerste jaar',
  scHeader: (total, dimensions) =>
    `We beoordelen kandidaten op <strong>${total} gewogen criteria</strong>, verdeeld over ${dimensions}, op een schaal van 1–5. Het gewicht weerspiegelt het relatieve belang.`,
  scDimensions: (n) =>
    n === 1
      ? 'één dimensie'
      : n === 2
        ? 'twee dimensies'
        : n === 3
          ? 'drie dimensies'
          : `${n} dimensies`,
  scColCriterion: 'Criterium',
  scColWeight: 'Gewicht',
  scEmpty: 'Nog geen scorecard-criteria toegevoegd.',

  candHardFactsLabel: 'Scoring op basis van harde factoren (CV)',
  candGdprDisclaimer:
    'In overeenstemming met de AVG delen we alleen publiek beschikbare informatie over kandidaten totdat we hun expliciete toestemming hebben voor een introductie. Vanwege het vertrouwelijke karakter van deze search zijn er op dit moment nog geen kandidaten benaderd.',
  candEmpty: 'Nog geen kandidaten toegevoegd.',

  feeEmpty: 'Nog geen fee-details vastgelegd.',
  feeSearchFee: 'Search fee',
  feeHeadlineEqualInstalments: (price, vat, numWord, triggers) =>
    `<p><strong>Search fee:</strong> De fee van ${price}${vat} wordt gefactureerd in ${numWord} gelijke termijnen: ${triggers}.</p>`,
  feeHeadlineSingle: (price, vat) =>
    `<p><strong>Search fee:</strong> De fee van ${price}${vat}.</p>`,
  feeNumWord: (n) =>
    n === 2 ? 'twee' : n === 3 ? 'drie' : n === 4 ? 'vier' : String(n),
  feeConjunction: 'en',
  feeInstalmentFallback: 'Termijn',
  feeSpecialTerms: 'Bijzondere voorwaarden',
  feeGuarantee: 'Garantie',
  feeGuaranteeDefault: (window) =>
    `Gratis vervangingssearch als de aangestelde kandidaat de functie binnen ${window} verlaat.`,
  feeMonth: 'maand',
  feeMonths: 'maanden',
  feePctBasisFallback: 'totale eerstejaarsbeloning',
  feePctOf: 'van',
  feeOptionalPrefix: 'Optioneel — ',

  cpRoleAt: 'bij',
  cpHardFactorsScore: 'Harde-factoren score',
  cpCareerOverview: 'Carrière-overzicht',
  cpColPeriod: 'Periode',
  cpColRole: 'Functie',
  cpColCompany: 'Bedrijf',
  cpColHighlights: 'Highlights',
  cpEducation: 'Opleiding',
  cpLanguages: 'Talen',
  cpScorecardHardOnly: 'Scorecard — alleen harde factoren',
  cpStrengths: 'Sterke punten',
  cpRisks: "Risico's / aandachtspunten",
  cpNavBack: '← Terug naar voorstel',
  cpNavPrev: '← Vorige',
  cpNavNext: 'Volgende →',
  cpMetaDescription: 'Vertrouwelijk kandidaatprofiel',
  cpFallbackProposal: 'Voorstel',
}

// ---------------------------------------------------------------------------
// Public accessor
// ---------------------------------------------------------------------------

const BUNDLES: Record<Locale, OutputStrings> = { en, nl }

export function getStrings(locale: Locale): OutputStrings {
  return BUNDLES[locale]
}
