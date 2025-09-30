# Module Specification Reference System

## How to Use Module Specifications

When working on any module, first check its specifications in the `specs/` directory:

```bash
# List all module specs
./spec-kit-module list

# Create new module spec
./spec-kit-module spec
```

## Module Specification Structure

```
specs/
├── clients/
│   ├── client-management.md
│   └── client-analytics.md
├── projects/
│   ├── project-creation.md
│   └── project-dashboard.md
├── contractors/
│   ├── contractor-onboarding.md
│   └── rate-card-management.md
└── [module-name]/
    └── [feature-name].md
```

## How Claude Code Should Use Specifications

### 1. Before Making Changes
- Check if there's an existing spec for the module/feature
- Read the specification to understand requirements
- Follow the acceptance criteria
- Comply with technical considerations

### 2. When Creating New Features
- Create a specification first using `./spec-kit-module spec`
- Get approval on the specification
- Create implementation plan
- Then implement according to the spec

### 3. Reference Format
When discussing code changes, reference the spec:
```
According to specs/clients/client-management.md:
- Requirement 3: "Client contact information must be validated"
- Acceptance Criteria 2: "Email format validation with proper error messages"
```

## Current Module Specifications

<!-- This section will be updated automatically -->
- **clients**: [List specs]
- **projects**: [List specs]
- **contractors**: [List specs]
- **procurement**: [List specs]
- **staff**: [List specs]
- **meetings**: [List specs]
- **sow**: [List specs]
- **analytics**: [List specs]
- **dashboard**: [List specs]

## Integration with Development Workflow

### 1. Feature Development
1. Check existing specs for the module
2. If no spec exists, create one first
3. Implement according to spec requirements
4. Update spec status to "Implemented"
5. Link to relevant page logs

### 2. Bug Fixes
1. Reference relevant specs to understand expected behavior
2. If bug reveals spec gaps, update the spec
3. Implement fix according to updated spec

### 3. Refactoring
1. Create "refactor" type spec
2. Document what needs to change
3. Ensure refactoring doesn't violate acceptance criteria
4. Update relevant tests

## Spec Template Components

Each spec includes:
- Module name and overview
- Requirements with priorities
- Acceptance criteria
- Technical considerations
- Dependencies
- Related files and paths

## Implementation Plans

Implementation plans are created in `plans/<module-name>/` and include:
- Phased approach
- Resource allocation
- Risk assessment
- Success criteria
- Timeline estimates

## Updating This Reference

Run `./spec-kit-module list` to see current specs and manually update this file when new specs are created.

---
**Last Updated**: [Auto-update when specs change]
**Total Modules**: [Count]
**Total Specifications**: [Count]