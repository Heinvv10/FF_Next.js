# Refactoring Quick Reference Guide

**Quick access guide for future refactoring sessions**

---

## 🚀 Quick Start (Next Session)

### 1. Pick Next File
```bash
# Check progress tracker
cat docs/REFACTORING_PROGRESS.md | grep "P1"

# Next file: POCreateModal.tsx (714 lines)
```

### 2. Analyze File
```bash
# Check current debt
npm run debt:check src/modules/procurement/orders/components/POCreateModal.tsx

# Count lines
wc -l src/modules/procurement/orders/components/POCreateModal.tsx

# Backup
cp src/modules/procurement/orders/components/POCreateModal.tsx \
   src/modules/procurement/orders/components/POCreateModal.tsx.backup
```

### 3. Create Structure
```bash
# Create directories
mkdir -p src/modules/procurement/orders/components/po-create-modal/{types,hooks,components}
```

### 4. Follow Pattern
See "Wizard Pattern" below for POCreateModal (similar to QuoteSubmissionModal)

---

## 📋 Common Patterns Reference

### Pattern 1: Wizard/Multi-Step Form

**Use for:** POCreateModal, QuoteSubmissionModal, any multi-step process

**Structure:**
```
po-create-modal/
├── types.ts                    # Form types
├── usePOForm.ts               # Form state & validation
├── ProgressStepper.tsx        # Step indicator (~40 lines)
├── Step1Component.tsx         # Each step (~80-120 lines)
├── Step2Component.tsx
├── Step3Component.tsx
├── POCreateModal.tsx          # Main orchestrator (~150 lines)
└── index.ts                   # Exports
```

**Main File Pattern:**
```typescript
import { Step1, Step2, Step3, ProgressStepper } from './components';
import { usePOForm } from './hooks/usePOForm';

export const POCreateModal = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { formData, errors, validate, updateField } = usePOForm();

  return (
    <Modal>
      <ProgressStepper current={currentStep} total={3} />
      {currentStep === 1 && <Step1 {...props} />}
      {currentStep === 2 && <Step2 {...props} />}
      {currentStep === 3 && <Step3 {...props} />}
      <NavigationButtons />
    </Modal>
  );
};
```

---

### Pattern 2: Tab-Based Page

**Use for:** SupplierPortalPage, CompanyProfileTab, any multi-tab interface

**Structure:**
```
module/
├── types/module.types.ts
├── hooks/useModule.ts
├── components/
│   ├── Tab1.tsx               # Each tab (~100-150 lines)
│   ├── Tab2.tsx
│   ├── Tab3.tsx
│   └── index.ts
└── ModulePage.tsx             # Main (~200 lines)
```

**Main File Pattern:**
```typescript
import { Tab1, Tab2, Tab3 } from './components';
import { useModule } from './hooks/useModule';

export const ModulePage = () => {
  const [activeTab, setActiveTab] = useState('tab1');
  const { data, actions } = useModule();

  return (
    <div>
      <TabNavigation active={activeTab} onChange={setActiveTab} />
      <TabContent>
        {activeTab === 'tab1' && <Tab1 data={data} {...actions} />}
        {activeTab === 'tab2' && <Tab2 data={data} {...actions} />}
        {activeTab === 'tab3' && <Tab3 data={data} {...actions} />}
      </TabContent>
    </div>
  );
};
```

---

### Pattern 3: List/Data Grid with Filters

**Use for:** StockManagementPage, ImportsDataGridPage, DocumentsTab

**Structure:**
```
module/
├── types/module.types.ts
├── data/mockData.ts
├── hooks/useDataManagement.ts    # Filter/sort logic
├── components/
│   ├── FiltersBar.tsx            # Search & filters (~80 lines)
│   ├── ItemCard.tsx              # List item (~120-150 lines)
│   ├── StatsCards.tsx            # Summary stats (~60 lines)
│   └── index.ts
└── ModulePage.tsx                # Main (~200 lines)
```

**Hook Pattern:**
```typescript
export const useDataManagement = (items) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const filteredItems = useMemo(() => {
    // Filter logic
  }, [items, searchTerm, filter]);

  const sortedItems = useMemo(() => {
    // Sort logic
  }, [filteredItems, sortBy]);

  const stats = useMemo(() => {
    // Calculate stats
  }, [items]);

  return {
    filteredItems: sortedItems,
    stats,
    searchTerm, setSearchTerm,
    filter, setFilter,
    sortBy, setSortBy
  };
};
```

---

### Pattern 4: Dashboard with Sections

**Use for:** ProcurementOverview, any dashboard page

**Structure:**
```
dashboard/
├── types/dashboard.types.ts
├── hooks/useDashboardData.ts
├── components/
│   ├── StatsSection.tsx          # Metrics cards
│   ├── ChartsSection.tsx         # Graphs
│   ├── AlertsSection.tsx         # Notifications
│   ├── RecentActivitySection.tsx # Activity feed
│   └── index.ts
└── DashboardPage.tsx             # Main (~150 lines)
```

**Main File Pattern:**
```typescript
import { StatsSection, ChartsSection, AlertsSection, RecentActivitySection } from './components';
import { useDashboardData } from './hooks/useDashboardData';

export const DashboardPage = () => {
  const { stats, charts, alerts, activity, loading } = useDashboardData();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <StatsSection data={stats} />
      <ChartsSection data={charts} />
      <AlertsSection alerts={alerts} />
      <RecentActivitySection activity={activity} />
    </div>
  );
};
```

---

## 🛠️ Essential Commands

### Analysis
```bash
# Check specific file
npm run debt:check src/path/to/file.tsx

# Check entire module
npm run debt:check src/modules/modulename

# Generate full report
npm run debt:report

# Find files over 300 lines
find src -name "*.tsx" -exec wc -l {} + | awk '$1 > 300' | sort -rn
```

### File Operations
```bash
# Create directories
mkdir -p src/module/{types,hooks,components,data}

# Backup file
cp file.tsx file.tsx.backup

# Line count
wc -l file.tsx

# Line count for module
wc -l src/module/**/*.{ts,tsx} | tail -1
```

### Verification
```bash
# TypeScript check
npm run type-check

# Build test
npm run build

# Production mode (for testing)
npm run build && PORT=3005 npm start
```

---

## ✅ Extraction Checklist (Copy & Use)

```markdown
## [FileName.tsx] Refactoring

- [ ] **Pre-Work**
  - [ ] Line count: _____ lines
  - [ ] Debt check: _____ issues
  - [ ] Backup created
  - [ ] Pattern identified: _____

- [ ] **Setup**
  - [ ] Created types/
  - [ ] Created hooks/
  - [ ] Created components/
  - [ ] Created data/ (if needed)

- [ ] **Extraction**
  - [ ] Types → types/module.types.ts
  - [ ] Mock data → data/mockData.ts
  - [ ] Logic → hooks/useModule.ts
  - [ ] Component 1 → components/Comp1.tsx
  - [ ] Component 2 → components/Comp2.tsx
  - [ ] Component 3 → components/Comp3.tsx
  - [ ] Index → components/index.ts

- [ ] **Refactor Main**
  - [ ] Import components
  - [ ] Import hooks
  - [ ] Replace inline code
  - [ ] Remove unused code
  - [ ] Check: <250 lines

- [ ] **Verify**
  - [ ] npm run type-check
  - [ ] npm run debt:check module
  - [ ] All files <200 lines
  - [ ] Functionality works
  - [ ] Build succeeds

- [ ] **Complete**
  - [ ] Update REFACTORING_PROGRESS.md
  - [ ] Commit changes
  - [ ] Note patterns/learnings
```

---

## 🎯 Size Guidelines

| File Type | Target | Max | Notes |
|-----------|--------|-----|-------|
| Main Page | <250 lines | 300 | Orchestration only |
| UI Component | <150 lines | 200 | Single responsibility |
| Custom Hook | <120 lines | 150 | Business logic |
| Type File | <80 lines | 100 | Related types grouped |
| Mock Data | <150 lines | - | Sample data only |

---

## 💡 Pro Tips

### Before Starting
1. ✅ Read the entire file first
2. ✅ Identify the pattern (wizard/tabs/list/dashboard)
3. ✅ Look at similar completed refactorings
4. ✅ Check REFACTORING_SESSION docs for examples

### During Refactoring
1. ✅ Extract in order: types → data → logic → UI
2. ✅ Test after each major extraction
3. ✅ Keep backup until 100% confident
4. ✅ Use consistent naming conventions
5. ✅ Run debt check frequently

### Common Mistakes to Avoid
1. ❌ Don't over-extract (files <50 lines)
2. ❌ Don't skip type definitions
3. ❌ Don't batch all changes (test incrementally)
4. ❌ Don't forget index.ts files
5. ❌ Don't commit without verification

---

## 📚 Reference Examples

### Completed Refactorings (Use as Templates)

| Pattern | Example Location | Key Features |
|---------|------------------|--------------|
| **Wizard** | `src/modules/procurement/suppliers/components/quote-modal/` | 3 steps, form hook, progress |
| **Tabs** | `src/modules/procurement/suppliers/components/portal-tabs/` | 6 tabs, shared types |
| **List + Filters** | `src/modules/procurement/stock/` | Filters, cards, hook |
| **Dashboard** | `src/modules/procurement/suppliers/SupplierPortalPage.tsx` | Stats, sections, alerts |

### Custom Hooks
- `useSupplierAuth` - Authentication flow
- `useStockManagement` - Filter/sort/stats
- `useQuoteForm` - Form state/validation

### Reusable Components
- `StatusBadge` - Color-coded status
- `StatsCards` - Metric display
- `Filters` - Search + filter controls
- `ItemCard` - List item display

---

## 🔗 Quick Links

- **Session Docs:** `docs/REFACTORING_SESSION_2025-11-18.md`
- **Progress Tracker:** `docs/REFACTORING_PROGRESS.md`
- **Tech Debt Report:** `docs/tech-debt-report.md`
- **Example Code:** `src/modules/procurement/suppliers/` or `stock/`

---

## 🚦 Decision Tree

**Should I extract this?**

```
Is file >300 lines?
├─ Yes → Extract (HIGH priority)
└─ No → Is component >200 lines?
   ├─ Yes → Extract (MEDIUM priority)
   └─ No → Is logic mixed with UI?
      ├─ Yes → Extract to hook
      └─ No → Keep as is ✅
```

**What pattern should I use?**

```
What is the structure?
├─ Multi-step form → Wizard Pattern
├─ Multiple tabs → Tab Pattern
├─ List with filters → List Pattern
├─ Multiple sections → Dashboard Pattern
└─ Other → Hybrid/Custom Pattern
```

---

**Last Updated:** November 18, 2025
**Next File:** POCreateModal.tsx (714 lines) - Use Wizard Pattern
