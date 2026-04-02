---
name: data-dictionary
description: >
  Domain reference for entity shapes, field naming conventions, and realistic
  executive search data patterns. Use when defining TypeScript interfaces,
  Zod schemas, API response types, or empty state copy. Understands the
  executive search domain at Top of Minds level.
---

# Data Dictionary — Executive Search Domain

## General Rules
- Dutch/European executive search context
- Executive-level roles (C-suite, VP, Director)
- Salary ranges in EUR, realistic for Dutch/European market
- Photo URLs point to Azure Blob CDN (e.g., https://cdn.pitchdecker.topofminds.com/team/slug.webp)

## Entity Shapes

### Team Members
Fields: id, name, title, photoUrl, bio, expertiseTags[]
- Titles: Partner, Managing Partner, Director, Principal, Associate
- Expertise tags: Healthcare, Technology, Financial Services,
  Private Equity, Industrial, Consumer, Professional Services

### Placements / Credentials
Fields: id, role, company, industry, year, description
- Grouped by "axis": industry, function, deal context
- Roles placed: CEO, CFO, COO, CTO, CHRO, CCO, CRO, VP-level
- Should feel like a real track record page

### Candidates
Fields: id, name, photoUrl, currentCompany, currentRole, age, summary,
        archetypeTag, scores[], overallScore, ranking
- Archetype tags: "The Industry Insider", "The Transformation Leader",
  "The Scale-Up Specialist", "The Corporate Strategist"
- Scores: per-criterion (linked to scorecard), 1-5 scale

### Scorecard Criteria
Fields: id, text, weight (1-5)
- Categories: Must-Haves, Nice-to-Haves, Leadership & Personality,
  First-Year Success Factors

### Timeline Phases
Fields: id, name, description, durationWeeks, milestones[], order
- Standard template: 12 weeks total
- Typical phases: Briefing & Strategy, Sourcing, First Round, Assessment, Final Round

### Fee Structures
Fields: feeStructure (retainer/contingency/hybrid), feePercentage,
        paymentMilestones[], exclusivityTerms, guaranteePeriod
- Standard: 33% retainer, paid in thirds

## Important
- This is a domain reference, NOT a data generation guide
- Never create mock JSON files — use these shapes for TypeScript interfaces and Zod schemas
- API routes return empty arrays/objects when no database is connected
