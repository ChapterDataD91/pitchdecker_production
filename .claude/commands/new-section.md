# New Section Editor

Create a new section editor component for the pitch deck builder.

Ask which section to create, then scaffold:
1. Component file at /components/editor/sections/{SectionName}Editor.tsx
2. TypeScript interface in /lib/types.ts (if not already defined)
3. Create empty-returning API route stub at /app/api/deck/[id]/sections/[sectionType]/route.ts (if not already created)
4. Register in the section list in the main editor page
5. Add section metadata to /lib/theme.ts SECTIONS array (if not already present)

Follow the patterns established in existing section editors.
Reference the section-editor skill for the correct interaction pattern.
