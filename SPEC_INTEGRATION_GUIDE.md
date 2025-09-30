# Module Specification Integration Guide

## How to Use Module-Specific Specs in Your Development Workflow

### 🎯 The Problem Solved
Instead of project-wide specs that are hard to reference, you now have **module-specific specifications** that integrate directly with your development workflow.

### 🚀 Quick Start

#### 1. Create a Module Specification
```bash
./spec-kit-module spec
```
This will:
- Show you all available modules (clients, projects, contractors, etc.)
- Let you select a module
- Guide you through creating a spec for that specific module
- Optionally create an implementation plan

#### 2. List Existing Specifications
```bash
./spec-kit-module list
```
Shows all specs organized by module with their current status.

### 📁 File Structure
```
specs/
├── clients/
│   ├── client-management.md
│   └── client-analytics.md
├── projects/
│   ├── project-creation.md
│   └── project-dashboard.md
└── contractors/
    └── contractor-onboarding.md

plans/
├── clients/
│   └── client-management-plan.md
└── projects/
    └── project-creation-plan.md
```

### 🤖 How Claude Code Uses This System

#### When Working on Code:
1. **Before making changes**: Claude checks `specs/[module-name]/` for relevant specs
2. **During implementation**: References acceptance criteria from the spec
3. **After implementation**: Updates spec status and links to page logs

#### Example Reference:
```
According to specs/clients/client-management.md:
- Requirement 2: "Client form must validate email format"
- Acceptance Criteria 1: "Real-time validation with error messages"
```

### 🔄 Development Workflow Integration

#### Step 1: Plan
```bash
./spec-kit-module spec
# Select module: clients
# Name: Email Validation Enhancement
# Type: update
# Priority: high
```

#### Step 2: Implement
- Work on `src/modules/clients/components/ClientForm.tsx`
- Reference the spec for requirements
- Follow acceptance criteria

#### Step 3: Update Documentation
- Update `docs/page-logs/clients.md`
- Update spec status to "Implemented"
- Link to related files

### 📋 Spec Content Example
Each spec includes:
- **Module**: Which module it belongs to
- **Requirements**: What needs to be built
- **Acceptance Criteria**: How to verify it's done
- **Technical Considerations**: Database, API, UI impacts
- **Existing Components**: What's already there
- **Related Files**: Direct paths to module files

### 🎯 Benefits for Your Workflow

1. **Targeted Specifications**: Specs are relevant to specific modules, not the whole project
2. **Easy Reference**: Claude Code can quickly find and reference relevant specs
3. **Better Planning**: Implementation plans are module-specific
4. **Traceability**: Connect specs → code → documentation
5. **Maintainable**: Easy to update and maintain specs per module

### 📊 Integration with Constitution

The module specs align with your constitution principles:
- **Code Quality First**: Specs define quality requirements
- **Modular Architecture**: Specs are module-specific
- **Documentation as Living Artifact**: Specs are part of the documentation system
- **Independent Development**: Each module has its own specs

### 🔧 Commands Available

```bash
# Create module specification
npm run spec-module spec
# or
./spec-kit-module spec

# List all specifications
npm run spec-module list
# or
./spec-kit-module list

# Create project-wide spec (original)
npm run spec-kit constitution
# or
./spec-kit [command]
```

### 🤝 Team Collaboration

#### For Developers:
- Check module specs before starting work
- Reference specs in commit messages
- Update spec status when complete

#### For Code Reviewers:
- Verify implementation matches spec requirements
- Check all acceptance criteria are met
- Ensure documentation is updated

#### For Project Managers:
- Track progress by spec status
- Plan work using implementation plans
- Allocate resources per module

### 📈 Usage Metrics

The system tracks:
- Number of specs per module
- Spec status (Draft → In Progress → Implemented)
- Implementation plan completion
- Integration with page logs

---

**Next Steps:**
1. Try creating a spec: `./spec-kit-module spec`
2. Check the generated spec file
3. Create an implementation plan
4. Integrate with your development workflow

This system makes specifications **actionable**, **referenceable**, and **integrated** with your actual codebase!