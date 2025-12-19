# FibreFlow UI/UX Refactor Plan - APEX Design System Integration

**Version**: 1.0
**Date**: 2025-12-18
**Status**: 📋 Planning Complete - Ready for Implementation
**Design Reference**: APEX Application Design System v4.1

---

## 🎯 Executive Summary

This document outlines a comprehensive UI/UX refactoring plan for the entire FibreFlow application, inspired by the APEX design system. The goal is to create a modern, cohesive, professional interface while maintaining functionality and following FibreFlow's modular architecture.

### Key Goals

1. **Modern Dark Theme**: Deep space aesthetic with cyan/purple accents (matching APEX)
2. **Unified Component System**: 3-tier card hierarchy, consistent buttons, badges, inputs
3. **Professional Visual Design**: Glassmorphism for modals, smooth animations, cohesive spacing
4. **Improved UX**: Better information hierarchy, clearer status indicators, enhanced navigation
5. **Zero Breaking Changes**: Incremental refactor with full backward compatibility

### Success Metrics

- **Visual Consistency**: 100% of pages use unified design tokens
- **Performance**: No impact on load times (existing bundle size)
- **User Satisfaction**: Modern, professional appearance
- **Developer Experience**: Clear component patterns, reusable utilities

---

## 📊 Current State Analysis

### FibreFlow Current UI

**Strengths**:
- Functional and stable
- Modular architecture (Lego blocks)
- Clerk authentication integrated
- AppLayout with sidebar navigation

**Weaknesses**:
- Inconsistent color usage across pages
- Mixed component styling (some custom, some shadcn/ui)
- No unified design system or style guide
- Variable card styles and spacing
- Lack of visual hierarchy

### APEX Design System (Source of Inspiration)

**Key Characteristics**:
- **Color Palette**: Deep navy backgrounds (#0a0f1a) with cyan accent (#00E5CC)
- **3-Tier Card System**: Primary (hero metrics), Secondary (charts), Tertiary (lists)
- **Typography**: Inter font, clear hierarchy, 14px body text
- **Components**: Polished buttons with shadows, gradient accents, status badges
- **Layout**: Sidebar navigation, PageHeader pattern, decorative elements
- **Animation**: Smooth 150ms micro-interactions, professional easing

**Agent Configuration** (from APEX `.claude/agents/project_agents.yaml`):
- `typescript-strict-enforcer`: Type safety validation (DGTS 0.35, NLNH 0.85)
- `react-best-practices-enforcer`: Hooks rules, component structure
- `nextjs-optimization-enforcer`: Image optimization, SSR validation
- `testing-coverage-enforcer`: 95% coverage requirement
- `complexity-manager`: Architecture validation, refactoring optimizer

---

## 🎨 Design System Components

### Color Tokens

Based on APEX's successful dark theme, adapted for FibreFlow branding:

```typescript
// tailwind.config.ts - Add to theme.extend.colors
const FIBREFLOW_DESIGN = {
  // Backgrounds (dark to light)
  bgDeep: "#0a0f1a",        // Page background (APEX: #0a0f1a)
  bgBase: "#0d1224",        // Main content area
  bgElevated: "#111827",    // Elevated surfaces
  bgCard: "#141930",        // Card backgrounds
  bgCardHover: "#1a2040",   // Card hover state
  bgInput: "#101828",       // Input fields

  // Primary Brand - FibreFlow Blue/Cyan
  primary: "#00E5CC",       // Main accent (APEX cyan - keep)
  primaryBright: "#00FFE0", // Hover/emphasis
  primaryMuted: "#00B8A3",  // Subdued state

  // Secondary Accents
  accentPurple: "#8B5CF6",  // Secondary accent
  accentPink: "#EC4899",    // Tertiary accent
  accentBlue: "#3B82F6",    // Info states

  // Semantic
  success: "#22C55E",       // Positive states (green)
  warning: "#F59E0B",       // Warning states (amber)
  error: "#EF4444",         // Error states (red)
  info: "#3B82F6",          // Informational (blue)

  // Text
  textPrimary: "#FFFFFF",   // Headings
  textSecondary: "#94A3B8", // Body text (slate-400)
  textMuted: "#64748B",     // Disabled (slate-500)
  textAccent: "#00E5CC",    // Links, highlights

  // Borders (ALWAYS use rgba for transparency)
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  borderAccent: "rgba(0, 229, 204, 0.3)",
  borderGlow: "rgba(0, 229, 204, 0.5)",
};
```

### CSS Variables (globals.css)

```css
/* FibreFlow Design System v1.0 - Based on APEX */
:root {
  /* Backgrounds */
  --bg-deep: 225 40% 6%;           /* #0a0f1a */
  --bg-base: 227 50% 9%;           /* #0d1224 */
  --bg-elevated: 228 40% 11%;      /* #111827 */
  --bg-card: 232 35% 12%;          /* #141930 */
  --bg-card-hover: 232 30% 16%;    /* #1a2040 */
  --bg-input: 230 35% 10%;         /* #101828 */

  /* Primary */
  --primary: 170 100% 45%;         /* #00E5CC - FibreFlow cyan */
  --primary-foreground: 230 67% 2%;

  /* Semantic */
  --success: 142 71% 45%;          /* #22C55E */
  --warning: 38 92% 50%;           /* #F59E0B */
  --error: 0 84% 60%;              /* #EF4444 */
  --destructive: 0 84% 60%;

  /* Accents */
  --accent-purple: 262 83% 66%;    /* #8B5CF6 */
  --accent-pink: 330 81% 56%;      /* #EC4899 */
  --accent-blue: 217 91% 60%;      /* #3B82F6 */

  /* Text */
  --text-primary: 0 0% 100%;
  --text-secondary: 215 16% 58%;   /* #94A3B8 */
  --text-muted: 215 16% 47%;       /* #64748B */

  /* Borders */
  --border: 0 0% 100% / 0.08;
  --border-subtle: 0 0% 100% / 0.05;
  --border-strong: 0 0% 100% / 0.12;
  --border-accent: 170 100% 45% / 0.3;
  --border-glow: 170 100% 45% / 0.5;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Border Radius */
  --radius: 0.75rem;       /* 12px */
  --radius-sm: 0.5rem;     /* 8px */
  --radius-lg: 1rem;       /* 16px */
  --radius-xl: 1.25rem;    /* 20px */

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-gauge: 800ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3-Tier Card System

Following APEX's card hierarchy for visual consistency:

#### Tier 1: Primary Cards (Hero Metrics)
**Usage**: Main KPIs, featured content, high-importance data

```tsx
// components/ui/card-primary.tsx
<div className="card-primary">
  {/* GEO Score gauge, project completion %, critical metrics */}
</div>
```

```css
.card-primary {
  background: linear-gradient(135deg, rgba(15, 18, 37, 0.9), rgba(10, 13, 26, 0.95));
  border: 1.5px solid rgba(0, 229, 204, 0.25);
  box-shadow: 0 0 30px rgba(0, 229, 204, 0.08), 0 4px 24px rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 24px;
}
```

#### Tier 2: Secondary Cards (Charts, Tables)
**Usage**: Data visualizations, detailed information, lists

```tsx
// components/ui/card-secondary.tsx
<div className="card-secondary">
  {/* Charts, tables, recommendations */}
</div>
```

```css
.card-secondary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
}
```

#### Tier 3: Tertiary Cards (List Items)
**Usage**: Activity rows, compact stats, list entries

```tsx
// components/ui/card-tertiary.tsx
<div className="card-tertiary">
  {/* Activity feed items, contractor list entries */}
</div>
```

```css
.card-tertiary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
}
```

### Typography Scale

```typescript
// tailwind.config.ts - Add to theme.extend.fontSize
fontSize: {
  'display-xl': ['48px', { lineHeight: '1.2', fontWeight: '700' }],  // Hero metrics
  'display': ['36px', { lineHeight: '1.2', fontWeight: '600' }],     // Page titles
  'h1': ['24px', { lineHeight: '1.3', fontWeight: '600' }],          // Section headers
  'h2': ['20px', { lineHeight: '1.4', fontWeight: '600' }],          // Card titles
  'h3': ['16px', { lineHeight: '1.5', fontWeight: '600' }],          // Subsections
  'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],        // Primary content
  'small': ['12px', { lineHeight: '1.5', fontWeight: '500' }],       // Labels, meta
  'tiny': ['10px', { lineHeight: '1.4', fontWeight: '500' }],        // Badges
}
```

### Button Variants

Enhanced button component with APEX-style shadows and animations:

```tsx
// components/ui/button.tsx (updated)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:-translate-y-0.5 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30",
        destructive: "bg-destructive text-white shadow-md shadow-destructive/25 hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        lg: "h-10 rounded-lg px-6",
        icon: "size-9",
      },
    },
  }
);
```

### Status Badges

```tsx
// components/ui/badge.tsx (enhanced)
<span className="badge-success">Completed</span>
<span className="badge-warning">In Progress</span>
<span className="badge-error">Failed</span>
<span className="badge-info">Pending</span>
```

```css
.badge-success {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(34, 197, 94, 0.15);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-warning {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-error {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

---

## 🏗️ Architecture & Agent Integration

### FibreFlow-Specific Agents

Based on APEX's agent configuration, create FibreFlow-specific agents in `.claude/agents/project_agents.yaml`:

```yaml
agents:
  # APEX-inspired agents (adapted for FibreFlow)
  - name: typescript-strict-enforcer
    type: code-quality-reviewer
    description: Enforces TypeScript strict mode and type safety
    mcp_servers:
      - context7
      - memory
    validation:
      dgts:
        threshold: 0.35
        custom_patterns:
          - id: TS_ANY_TYPE
            severity: CRITICAL
            regex: \bany\b(?!\s*\()
            description: TypeScript 'any' type usage
            category: type_safety
      nlnh:
        confidence_threshold: 0.85
      quality_gates:
        - TYPE_CHECK_REQUIRED
        - NO_ANY_TYPES

  - name: nextjs-optimization-enforcer
    type: performance-optimizer
    description: Enforces Next.js performance best practices
    mcp_servers:
      - context7
      - memory
    validation:
      dgts:
        threshold: 0.3
        custom_patterns:
          - id: NEXTJS_IMG_TAG
            severity: MAJOR
            regex: <img\s+
            description: Using <img> instead of Next.js Image component
            category: performance
      quality_gates:
        - SSR_VALIDATION
        - IMAGE_OPTIMIZATION

  - name: ui-ux-consistency-enforcer
    type: design-system-validator
    description: Enforces FibreFlow design system (APEX-inspired)
    mcp_servers:
      - context7
      - memory
    validation:
      dgts:
        threshold: 0.3
        custom_patterns:
          - id: HARDCODED_COLORS
            severity: MAJOR
            regex: (text-|bg-|border-)(red|blue|green|yellow|purple|pink)-\d00
            description: Hardcoded Tailwind colors instead of design tokens
            category: design_system
          - id: INLINE_STYLES
            severity: MAJOR
            regex: style=\{\{
            description: Inline styles instead of CSS classes
            category: design_system
      quality_gates:
        - USE_DESIGN_TOKENS
        - CONSISTENT_SPACING
        - CARD_HIERARCHY_VALIDATION

  # Existing FibreFlow agents (keep)
  - name: database-guardian
    type: database-validator
    description: Validates ep-dry-night-a9qyh4sj endpoint (CRITICAL)
    # ... existing configuration

  - name: wa-monitor-specialist
    type: module-isolation-validator
    description: Enforces WA Monitor module isolation (CRITICAL)
    # ... existing configuration

  - name: api-route-validator
    type: api-standard-enforcer
    description: Enforces apiResponse helper (MAJOR)
    # ... existing configuration

  - name: deployment-validator
    type: deployment-workflow-enforcer
    description: Enforces dev-first workflow (CRITICAL)
    # ... existing configuration

  - name: clerk-auth-specialist
    type: authentication-validator
    description: Prevents Firebase Auth usage (CRITICAL)
    # ... existing configuration
```

### UI/UX Skill Integration

Create new skill in `.claude/skills/fibreflow-ui-ux/`:

```markdown
# FibreFlow UI/UX Design System Skill

Enforces APEX-inspired design system for FibreFlow application.

## When to Invoke

- Creating new pages or components
- Refactoring existing UI
- Reviewing design consistency
- Planning new features with UI

## Design Tokens

Use design tokens from `src/lib/design-tokens.ts`:
- Colors: `FIBREFLOW_DESIGN.primary`, `FIBREFLOW_DESIGN.bgCard`
- Spacing: `FIBREFLOW_SPACING.card`, `FIBREFLOW_SPACING.section`
- Typography: `FIBREFLOW_TYPE.h1`, `FIBREFLOW_TYPE.body`

## Card Hierarchy

1. **Primary Cards**: Hero metrics, GEO Score, completion %
2. **Secondary Cards**: Charts, tables, detailed data
3. **Tertiary Cards**: List items, activity feed entries

## Component Patterns

- Button: Use `buttonVariants` from `@/components/ui/button`
- Badge: Use semantic badges (`badge-success`, `badge-warning`)
- Modal: Use glassmorphism pattern (backdrop blur, subtle border)
- Input: Dark background, subtle border, cyan focus ring

## Validation Rules

❌ **Anti-Patterns**:
- Hardcoded colors (`text-blue-500`)
- Inline styles (`style={{ color: 'red' }}`)
- Inconsistent spacing (random px values)
- Mixed card styles
- Pure black backgrounds (`#000000`)

✅ **Best Practices**:
- Design tokens (`text-primary`, `bg-card`)
- TailwindCSS utility classes
- Consistent spacing scale (`space-4`, `space-6`)
- 3-tier card system
- Deep space backgrounds (`bgDeep: #0a0f1a`)

## Page Layout Pattern

### Main Pages (Top-level Routes)
```tsx
<div className="space-y-6 relative">
  <PageHeader />  {/* APEX logo + module name */}
  {/* Main content */}
  <DecorativeStar />  {/* Bottom-right decorative element */}
</div>
```

### Sub-Pages (Nested Routes)
```tsx
<div className="space-y-6">
  <Link href="/parent" className="back-link">
    <ArrowLeft /> Back to Parent
  </Link>
  <h1 className="text-2xl font-bold">Page Title</h1>
  {/* Main content */}
</div>
```

## References

- Design System: `docs/feature-expansion/UI-UX-REFACTOR-PLAN.md`
- APEX Reference: `C:\Jarvis\AI Workspace\Apex\docs\APEX_DESIGN_SYSTEM.md`
- Component Library: `src/components/ui/`
```

---

## 📋 Implementation Phases

### Phase 1: Foundation Setup (Week 1)

**Goal**: Establish design system infrastructure without breaking existing functionality

**Tasks**:
1. **Design Tokens File** (`src/lib/design-tokens.ts`)
   ```typescript
   export const FIBREFLOW_DESIGN = {
     // Color tokens
     // Spacing tokens
     // Typography tokens
   };

   export const FIBREFLOW_SPACING = {
     card: '24px',
     section: '32px',
     // ... more spacing
   };

   export const FIBREFLOW_TYPE = {
     h1: 'text-2xl font-bold text-foreground',
     h2: 'text-xl font-semibold text-foreground',
     body: 'text-sm text-secondary',
     // ... more typography
   };
   ```

2. **Update `globals.css`**
   - Add APEX-inspired CSS variables
   - Define card hierarchy classes
   - Add badge utility classes
   - Define animation utilities

3. **Update `tailwind.config.ts`**
   - Add design tokens to theme.extend
   - Configure color palette
   - Add custom spacing scale
   - Add typography scale

4. **Create Base Components**
   - `components/ui/card-primary.tsx`
   - `components/ui/card-secondary.tsx`
   - `components/ui/card-tertiary.tsx`
   - Update `components/ui/button.tsx` (APEX variants)
   - Update `components/ui/badge.tsx` (semantic badges)

5. **Testing**
   - Create Storybook stories for all components
   - Visual regression testing with Playwright
   - Verify no breaking changes to existing pages

**Deliverables**:
- ✅ Design system infrastructure in place
- ✅ Component library updated
- ✅ Zero breaking changes to existing pages
- ✅ Documentation in `docs/design-system/`

### Phase 2: Page Layout Refactor (Week 2)

**Goal**: Implement APEX-inspired page layout pattern across all pages

**Tasks**:
1. **Create Layout Components**
   - `components/layout/PageHeader.tsx` (APEX logo + module name)
   - `components/layout/DecorativeStar.tsx` (bottom-right decorative element)
   - `components/layout/BackLink.tsx` (sub-page navigation)

2. **Update Main Pages** (use PageHeader + DecorativeStar):
   - `/dashboard` (Dashboard Overview)
   - `/contractors` (Contractor Management)
   - `/projects` (Project List)
   - `/wa-monitor` (WhatsApp QA Monitor)
   - `/rag` (Contractor Health)
   - `/qfieldsync` (QField Sync Dashboard)
   - `/sow` (SOW Import)
   - `/foto-reviews` (Photo Reviews)

3. **Update Sub-Pages** (use BackLink pattern):
   - `/contractors/[contractorId]` (Contractor Details)
   - `/contractors/[contractorId]/documents` (Documents)
   - `/contractors/[contractorId]/teams` (Teams)
   - `/projects/[projectId]` (Project Details)
   - `/projects/[projectId]/drops` (Drops)

4. **Responsive Layout**
   - Mobile: Stack layout, collapsed sidebar
   - Tablet: Hybrid layout
   - Desktop: Full sidebar + content

**Deliverables**:
- ✅ Consistent page layout across all routes
- ✅ Mobile-responsive design
- ✅ Unified navigation patterns

### Phase 3: Component Styling (Week 3)

**Goal**: Apply APEX design system to all UI components

**Priority 1: High-Visibility Components**
1. **Dashboard Cards**
   - Replace custom cards with `card-primary` (KPIs)
   - Replace list cards with `card-secondary` (charts)
   - Apply `card-tertiary` to activity feeds

2. **Buttons**
   - Update all `<Button>` usage to new variants
   - Add subtle shadows and hover animations
   - Ensure consistent sizing

3. **Status Badges**
   - Replace custom status indicators with semantic badges
   - Apply color-coded badges (success, warning, error)
   - Add icon support

4. **Form Inputs**
   - Dark input backgrounds (`bgInput`)
   - Cyan focus rings
   - Subtle borders
   - Placeholder text styling

**Priority 2: Tables & Data Grids**
1. **Data Tables**
   - Dark table backgrounds
   - Alternating row colors
   - Hover states
   - Sticky headers

2. **Modals & Dialogs**
   - Glassmorphism effect (backdrop blur)
   - Subtle cyan glow border
   - Smooth open/close animations

**Priority 3: Specialized Components**
1. **WA Monitor Components**
   - `QaReviewCard.tsx` → `card-secondary`
   - `DropStatusBadge.tsx` → semantic badges
   - `WaMonitorFilters.tsx` → updated inputs

2. **Contractor Components**
   - Contractor cards → `card-tertiary`
   - Onboarding progress → gradient progress bars
   - Team tables → dark table styling

**Deliverables**:
- ✅ All components use design system tokens
- ✅ Consistent visual language
- ✅ Polished interactions (hover, focus, active)

### Phase 4: Ticketing System UI (Week 4)

**Goal**: Design and implement ticketing system with APEX-inspired modern UI

**Based on PRD** (`docs/feature-expansion/PRD-ticketing-module.md`):

1. **Ticket Dashboard Page** (`/tickets`)
   - **Layout**: Main page with PageHeader + DecorativeStar
   - **Hero Metrics** (card-primary):
     - Total Tickets (72)
     - Open Tickets (18)
     - Avg Resolution Time (4.2 hours)
     - Customer Satisfaction (4.8/5)
   - **Ticket List** (card-secondary):
     - Data table with filtering
     - Source badges (QContact, WhatsApp, Email, etc.)
     - Category badges (Installation, Maintenance, Support)
     - Status badges (Open, In Progress, Resolved, Closed)
     - Priority indicators (Critical, High, Medium, Low)

2. **Ticket Detail Page** (`/tickets/[uid]`)
   - **Layout**: Sub-page with BackLink
   - **Header Section** (card-primary):
     - Ticket UID (e.g., `FT12345`, `DR789-01`)
     - Status badge
     - Priority badge
     - Source badge
     - Assigned to (avatar + name)
   - **Tabs** (card-secondary):
     - **Details**: Full description, timeline, custom fields
     - **Comments**: Activity feed with timestamps
     - **Related**: Linked tickets, duplicates
     - **History**: Status changes, assignments
   - **Action Sidebar**:
     - Change Status dropdown
     - Change Priority dropdown
     - Assign To dropdown
     - Add Comment textarea + button
     - Link Ticket search + button

3. **WhatsApp Chat Interface** (`/tickets/[uid]/chat`)
   - **Layout**: Sub-page with BackLink
   - **Split Layout**:
     - **Left (60%)**: Chat interface (card-secondary)
       - Message list with timestamps
       - Sender avatars
       - Message bubbles (outbound: cyan, inbound: dark)
       - Delivery status indicators (✓ sent, ✓✓ delivered, ✓✓ read)
       - Media thumbnails (images, videos)
       - Reply threading
       - Message input + send button
     - **Right (40%)**: Ticket context (card-tertiary)
       - Ticket details (UID, status, category)
       - Customer info (name, phone, DR number)
       - Related tickets
       - Activity history

4. **QContact Integration Page** (`/tickets/qcontact-sync`)
   - **Layout**: Main page
   - **Sync Status** (card-primary):
     - Last sync timestamp
     - Success rate (95%)
     - Pending sync count (3)
     - Sync Now button
   - **Synced Tickets** (card-secondary):
     - Table of QContact tickets
     - FibreFlow UID ↔ QContact ID mapping
     - Sync status indicators
     - Error handling alerts

5. **Email Parsing Dashboard** (`/tickets/email`)
   - **Layout**: Main page
   - **Inbox Status** (card-primary):
     - Unprocessed emails (2)
     - Processed today (15)
     - Parse errors (0)
   - **Email Queue** (card-secondary):
     - Table of incoming emails
     - Subject, sender, timestamp
     - Parse status
     - View Email button → opens modal with email preview

6. **Ticket Creation Form** (`/tickets/new`)
   - **Layout**: Sub-page with BackLink
   - **Form** (card-secondary):
     - Source selection (dropdown with icons)
     - Category selection (Installation, Maintenance, Support, etc.)
     - Priority selection (Critical, High, Medium, Low)
     - Title (text input)
     - Description (textarea with markdown support)
     - Custom fields (dynamic based on category)
     - Attachments (file upload)
     - Create Ticket button (primary variant)

**Design Patterns**:
- **Icons**: Lucide React icons for consistency
- **Color Coding**:
  - Critical: Red (#EF4444)
  - High: Orange (#F59E0B)
  - Medium: Blue (#3B82F6)
  - Low: Green (#22C55E)
- **Animations**:
  - Smooth page transitions (250ms)
  - Card hover lift effect
  - Button hover shadow
  - Badge pulse for urgent tickets
- **Responsive**:
  - Mobile: Stack cards vertically
  - Tablet: 2-column grid
  - Desktop: 3-column grid or split layout

**Deliverables**:
- ✅ Modern ticketing UI matching APEX aesthetic
- ✅ Intuitive ticket management workflows
- ✅ WhatsApp chat interface with rich context
- ✅ Multi-source ticket aggregation dashboard
- ✅ Mobile-responsive layouts

### Phase 5: Dark Mode & Accessibility (Week 5)

**Goal**: Ensure accessibility and optional light mode support

**Tasks**:
1. **Accessibility Audit**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus indicators
   - Color contrast ratios (>4.5:1 for text)

2. **Light Mode Support** (Optional)
   - Create light mode color palette
   - Theme toggle component
   - LocalStorage theme persistence
   - System preference detection

3. **Performance Optimization**
   - Bundle size analysis
   - Tree-shaking unused CSS
   - Critical CSS inlining
   - Font loading optimization

**Deliverables**:
- ✅ WCAG 2.1 AA compliant
- ✅ Optional light mode
- ✅ No performance regression

### Phase 6: Documentation & Migration Guide (Week 6)

**Goal**: Document design system and create migration guide for developers

**Tasks**:
1. **Design System Documentation**
   - Create `docs/design-system/README.md`
   - Component usage examples
   - Color palette reference
   - Typography scale
   - Spacing guidelines
   - Animation patterns

2. **Migration Guide**
   - Create `docs/design-system/MIGRATION_GUIDE.md`
   - Before/After code examples
   - Common pitfalls
   - Deprecation warnings
   - Breaking changes (if any)

3. **Storybook Setup**
   - Install Storybook
   - Create stories for all components
   - Interactive component playground
   - Visual regression testing

4. **Developer Training**
   - Team walkthrough
   - Component library demo
   - Q&A session
   - Recorded tutorial video

**Deliverables**:
- ✅ Comprehensive documentation
- ✅ Migration guide for developers
- ✅ Storybook component library
- ✅ Team training complete

---

## 🛠️ Technical Implementation Details

### File Structure

```
src/
├── lib/
│   ├── design-tokens.ts          # NEW: Design system tokens
│   └── utils.ts                   # Existing utils (keep)
│
├── components/
│   ├── ui/                        # Enhanced shadcn/ui components
│   │   ├── card-primary.tsx       # NEW: Tier 1 cards
│   │   ├── card-secondary.tsx     # NEW: Tier 2 cards
│   │   ├── card-tertiary.tsx      # NEW: Tier 3 cards
│   │   ├── button.tsx             # UPDATED: APEX variants
│   │   ├── badge.tsx              # UPDATED: Semantic badges
│   │   ├── input.tsx              # UPDATED: Dark theme
│   │   ├── dialog.tsx             # UPDATED: Glassmorphism
│   │   └── ... (existing)
│   │
│   ├── layout/                    # NEW: Layout components
│   │   ├── PageHeader.tsx         # APEX logo + module name
│   │   ├── DecorativeStar.tsx     # Bottom-right decorative element
│   │   ├── BackLink.tsx           # Sub-page navigation
│   │   └── AppLayout.tsx          # UPDATED: Existing layout
│   │
│   └── ... (existing modules)
│
├── app/
│   ├── globals.css                # UPDATED: APEX-inspired CSS variables
│   ├── layout.tsx                 # UPDATED: Root layout
│   └── ... (existing pages)
│
├── tailwind.config.ts             # UPDATED: Design tokens
│
docs/
├── design-system/
│   ├── README.md                  # NEW: Design system guide
│   ├── MIGRATION_GUIDE.md         # NEW: Developer migration guide
│   └── components/                # NEW: Component documentation
│       ├── cards.md
│       ├── buttons.md
│       └── badges.md
│
.claude/
├── agents/
│   └── project_agents.yaml        # UPDATED: Add UI/UX agent
│
└── skills/
    └── fibreflow-ui-ux/           # NEW: UI/UX design skill
        └── SKILL.md
```

### Key Code Changes

#### 1. globals.css (Add APEX Variables)

```css
/* FibreFlow Design System v1.0 - Based on APEX */
@import "tailwindcss";

@theme inline {
  /* See "CSS Variables" section above for full content */
}

/* Card Hierarchy */
.card-primary {
  background: linear-gradient(135deg, rgba(15, 18, 37, 0.9), rgba(10, 13, 26, 0.95));
  border: 1.5px solid rgba(0, 229, 204, 0.25);
  box-shadow: 0 0 30px rgba(0, 229, 204, 0.08), 0 4px 24px rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 24px;
}

.card-secondary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
}

.card-tertiary {
  background: rgba(15, 18, 37, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
}

/* Semantic Badges */
.badge-success {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(34, 197, 94, 0.15);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-warning {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-error {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-info {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium;
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Glassmorphism (Modals only) */
.glass-modal {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(20, 25, 48, 0.7);
  border: 1px solid rgba(0, 229, 204, 0.2);
  box-shadow: 0 0 40px rgba(0, 229, 204, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Animation Utilities */
.transition-smooth {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}
```

#### 2. tailwind.config.ts (Add Design Tokens)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // FibreFlow Design System (APEX-inspired)
        bgDeep: "#0a0f1a",
        bgBase: "#0d1224",
        bgElevated: "#111827",
        bgCard: "#141930",
        bgCardHover: "#1a2040",
        bgInput: "#101828",

        primary: "#00E5CC",
        primaryBright: "#00FFE0",
        primaryMuted: "#00B8A3",

        accentPurple: "#8B5CF6",
        accentPink: "#EC4899",
        accentBlue: "#3B82F6",

        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",

        textPrimary: "#FFFFFF",
        textSecondary: "#94A3B8",
        textMuted: "#64748B",
        textAccent: "#00E5CC",

        // shadcn/ui compatibility
        background: "hsl(var(--bg-deep))",
        foreground: "hsl(var(--text-primary))",
        card: {
          DEFAULT: "hsl(var(--bg-card))",
          foreground: "hsl(var(--text-primary))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--bg-input))",
        ring: "hsl(var(--primary))",
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'display': ['36px', { lineHeight: '1.2', fontWeight: '600' }],
        'h1': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
        'tiny': ['10px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

#### 3. PageHeader Component

```tsx
// components/layout/PageHeader.tsx
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  moduleName: string;
  gradientId: string;
  className?: string;
}

export function PageHeader({ moduleName, gradientId, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Left: APEX Logo + Module Name */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 28H4L16 4Z" fill={`url(#${gradientId})`} />
            <defs>
              <linearGradient
                id={gradientId}
                x1="4"
                y1="28"
                x2="28"
                y2="4"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00E5CC" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          FibreFlow
        </span>
        <span className="text-xl font-light text-foreground ml-1">{moduleName}</span>
      </div>

      {/* Right: AI Status Indicator (Optional) */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">System:</span>
        <span className="text-xs text-primary font-medium">Active</span>
      </div>
    </div>
  );
}
```

#### 4. Card Components

```tsx
// components/ui/card-primary.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardPrimaryProps {
  children: ReactNode;
  className?: string;
}

export function CardPrimary({ children, className }: CardPrimaryProps) {
  return (
    <div className={cn("card-primary", className)}>
      {children}
    </div>
  );
}

// components/ui/card-secondary.tsx
export function CardSecondary({ children, className }: CardPrimaryProps) {
  return (
    <div className={cn("card-secondary", className)}>
      {children}
    </div>
  );
}

// components/ui/card-tertiary.tsx
export function CardTertiary({ children, className }: CardPrimaryProps) {
  return (
    <div className={cn("card-tertiary", className)}>
      {children}
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Visual Regression Testing

```bash
# Playwright visual regression
npm run test:visual

# Compares screenshots before/after refactor
# Fails if visual differences exceed threshold
```

### Component Testing

```bash
# Vitest component tests
npm test

# Tests component behavior, accessibility
```

### Manual QA Checklist

- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] Forms submit successfully
- [ ] Tables paginate and filter
- [ ] Modals open/close smoothly
- [ ] Buttons have hover/focus states
- [ ] Mobile responsive (test on real device)
- [ ] Dark mode toggle works (if implemented)
- [ ] Keyboard navigation functional
- [ ] Screen reader compatibility

---

## 📊 Success Metrics

### Visual Consistency

- **Target**: 100% of pages use design system tokens
- **Measurement**: Automated CSS audit checking for hardcoded colors
- **Success Criteria**: Zero hardcoded Tailwind colors (e.g., `text-blue-500`)

### Performance

- **Target**: No bundle size increase >5%
- **Measurement**: Webpack bundle analyzer
- **Success Criteria**: CSS bundle ≤ current size + 50KB

### User Satisfaction

- **Target**: Improved visual appeal
- **Measurement**: User feedback survey (5-point scale)
- **Success Criteria**: Average rating ≥ 4.0/5.0

### Developer Experience

- **Target**: Faster component development
- **Measurement**: Time to build new page (before vs after)
- **Success Criteria**: 30% reduction in time

---

## ⚠️ Risks & Mitigations

### Risk 1: Breaking Changes
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Incremental rollout (one page at a time)
- Comprehensive visual regression tests
- Feature flags for new components
- Rollback plan (Git branch protection)

### Risk 2: Performance Regression
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Bundle size monitoring
- Lazy loading for heavy components
- Tree-shaking unused CSS
- Performance budgets in CI

### Risk 3: Browser Compatibility
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Test on Chrome, Firefox, Safari, Edge
- Polyfills for CSS features (backdrop-filter)
- Progressive enhancement approach

### Risk 4: Developer Adoption
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Comprehensive documentation
- Migration guide with examples
- Team training session
- Code review enforcement

---

## 🔗 References

### APEX Design System
- **Main Reference**: `C:\Jarvis\AI Workspace\Apex\docs\APEX_DESIGN_SYSTEM.md`
- **Implementation**: `C:\Jarvis\AI Workspace\Apex\src\app\globals.css`
- **Components**: `C:\Jarvis\AI Workspace\Apex\src\components\ui\`
- **Agents**: `C:\Jarvis\AI Workspace\Apex\.claude\agents\project_agents.yaml`

### FibreFlow Current State
- **Coding Standards**: `docs/CODING_STANDARDS.md`
- **Architecture**: `CLAUDE.md`
- **Database**: `docs/DATABASE_TABLES.md`
- **WA Monitor**: `src/modules/wa-monitor/README.md`

### External Resources
- **shadcn/ui**: https://ui.shadcn.com/
- **TailwindCSS**: https://tailwindcss.com/
- **Radix UI**: https://www.radix-ui.com/
- **Lucide Icons**: https://lucide.dev/

---

## 📅 Timeline

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 1: Foundation | 1 week | Week 1 | Week 1 | ⏸️ Pending |
| Phase 2: Layout | 1 week | Week 2 | Week 2 | ⏸️ Pending |
| Phase 3: Components | 1 week | Week 3 | Week 3 | ⏸️ Pending |
| Phase 4: Ticketing UI | 1 week | Week 4 | Week 4 | ⏸️ Pending |
| Phase 5: Accessibility | 1 week | Week 5 | Week 5 | ⏸️ Pending |
| Phase 6: Documentation | 1 week | Week 6 | Week 6 | ⏸️ Pending |

**Total Estimated Effort**: 6 weeks (1 developer, full-time)

---

## 🎯 Next Steps

**Immediate Actions** (After plan approval):

1. **Foundation Setup** (Day 1-2):
   - Create `src/lib/design-tokens.ts`
   - Update `globals.css` with APEX variables
   - Update `tailwind.config.ts` with design tokens

2. **Component Library** (Day 3-5):
   - Create card-primary/secondary/tertiary components
   - Update Button component with APEX variants
   - Update Badge component with semantic badges
   - Create Storybook stories

3. **First Page Refactor** (Day 6-7):
   - Choose low-risk page (e.g., `/dashboard`)
   - Apply new layout pattern
   - Test thoroughly
   - Get user feedback

4. **Iteration** (Weeks 2-6):
   - Refactor remaining pages
   - Build ticketing system UI
   - Add accessibility features
   - Complete documentation

---

**Plan Status**: ✅ Complete and Ready for Implementation
**Estimated Effort**: 6 weeks (1 developer, full-time)
**Risk Level**: Low-Medium (incremental approach, comprehensive testing)

*This plan has been designed to modernize FibreFlow's UI/UX based on APEX's proven design system while maintaining full functionality and following FibreFlow's architectural standards.*
