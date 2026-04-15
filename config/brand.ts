// ---------------------------------------------------------------------------
// Editor-side brand identity.
//
// This is the brand shown in the *editor chrome* — sidebar label, dashboard
// title, support email, etc. It is INTENTIONALLY SEPARATE from the brand used
// by the published pitch deck output, which lives at:
//   /output-template/brand.ts
//
// The two systems share a repo but no styling, no fonts, and no source of
// truth. A second-recruiter rebrand of the editor would change this file
// alone; the published deck's huisstijl is owned by /output-template/brand.ts.
//
// ESLint rule (no-restricted-imports in eslint.config.mjs) prevents code
// outside /output-template/** from reaching into /output-template/brand.ts,
// so the firewall is enforced both ways.
// ---------------------------------------------------------------------------

export interface EditorBrand {
  /** Display name shown in editor chrome (sidebar, dashboard, footer). */
  name: string
  /** Email shown in support links / "contact us" surfaces. */
  supportEmail: string
  /** Page <title> for the dashboard and editor surfaces. */
  appTitle: string
  /** Optional inline SVG mark for the sidebar/topbar. Leave empty to show name only. */
  logoSvg?: string
}

export const editorBrand: EditorBrand = {
  name: 'Top of Minds',
  supportEmail: 'support@topofminds.com',
  appTitle: 'PitchDecker — Top of Minds',
  // No logo mark for now — sidebar uses the text label.
  logoSvg: '',
}
