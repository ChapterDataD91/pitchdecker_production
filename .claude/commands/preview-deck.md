# Preview Deck

Build and open deck preview at /deck/[id]/preview.

This command is for Phase 3 when the output template is built.
Currently shows a placeholder page indicating preview is not yet available.

When implemented, this will:
1. Gather all section data from the Zustand store
2. Inject data into the HTML/CSS template (using huisstijl brand guide)
3. Render the preview in a new tab or embedded view
4. Provide a "Publish" button to upload to Azure Blob Storage
