# /log - Add Entry to CHANGELOG

Add a new entry to `docs/CHANGELOG.md` with today's work.

## Usage

```
/log [type] [title]
```

## Examples

```
/log fix Contractor approval buttons
/log feature User dashboard analytics
/log enhancement Improved error messages
/log docs Updated API documentation
```

## What It Does

1. Opens `docs/CHANGELOG.md`
2. Asks you for:
   - What was done (bullet points)
   - Files changed (key files)
   - Whether it's deployed
   - Related git commit/page logs
3. Formats and adds the entry with today's date
4. Saves the file

## Entry Types

- `feature` - New functionality
- `fix` - Bug fixes
- `enhancement` - Improvements
- `refactor` - Code restructuring
- `docs` - Documentation
- `infrastructure` - Build/deploy/tooling
- `performance` - Optimizations
- `security` - Security changes

---

## Prompt

You are helping the user add an entry to the CHANGELOG.

1. **Parse the command**: Extract type and title from `/log [type] [title]`

2. **Gather information** by asking the user:
   ```
   What was done? (bullet points)
   Files changed? (key files only)
   Deployed? (y/n)
   Git commit hash? (if deployed)
   Related page logs? (if any)
   ```

3. **Format the entry**:
   ```markdown
   ## YYYY-MM-DD - [Type]: Title

   ### What Was Done
   - [user's bullet points]

   ### Files Changed
   - [user's files]

   ### Deployed
   - [x] Deployed to Vercel (commit: [hash])
   OR
   - [ ] Not yet deployed

   ### Related
   - Git commit: [hash]
   - Page logs: [links]

   ### Testing
   - [ ] Local:
   - [ ] Production:

   ### Impact
   - **User-Facing**:
   - **Developer**:
   ```

4. **Add to CHANGELOG**: Read `docs/CHANGELOG.md`, add the entry at the top (after the header but before previous entries), and save.

5. **Confirm**: Show the user what was added.

**Important**:
- Use today's date in YYYY-MM-DD format
- Capitalize the type (e.g., [Fix], [Feature])
- Be concise but informative
- If user deployed, mark checkbox as [x], otherwise [ ]
