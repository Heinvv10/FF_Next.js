# FibreFlow Agent OS Configuration

This directory contains Agent OS configuration for Claude Code AI assistants, providing structured context, workflows, and specialized agents for FibreFlow development.

## 🚀 Quick Start Guides

**New to Agent OS?** Start here:

1. **[Agent Selection Guide](AGENT_SELECTION_GUIDE.md)** - Which agent should you use? ⭐
2. **[Visual Guides](VISUAL_GUIDES.md)** - Flowcharts and decision trees 📊
3. **[Testing Summary](.agent-os/testing/TESTING_SUMMARY.md)** - Agent quality assessment ✅

## Directory Structure

```
.agent-os/
├── README.md                          # This file - Agent OS overview
├── AGENT_SELECTION_GUIDE.md           # Which agent to use ⭐ NEW
├── VISUAL_GUIDES.md                   # Flowcharts & decision trees 📊 NEW
│
├── agents/                            # Specialized AI agents (with Quick Reference)
│   ├── implementer.md                 # Full-stack implementation agent ⚡ UPDATED
│   ├── spec-writer.md                 # Technical specification writer ⚡ UPDATED
│   ├── vps-deployment.md              # VPS deployment specialist ⚡ UPDATED
│   └── wa-agent.md                    # WhatsApp Monitor expert ⚡ UPDATED
│
├── workflows/                         # Development workflows
│   ├── implementation/                # Implementation process workflows
│   ├── planning/                      # Product planning workflows
│   └── specification/                 # Specification writing workflows
│
├── standards/                         # Coding standards and patterns
│   ├── api-response-format.md         # API response standardization
│   ├── modular-architecture.md        # Modular "Lego block" pattern
│   └── deployment-workflow.md         # Deployment procedures
│
├── commands/                          # Validation commands
│   ├── validate-database.md           # Database validation
│   ├── validate-vps-services.md       # VPS service checks
│   └── validate-wa-monitor.md         # WA Monitor validation
│
├── testing/                           # Testing artifacts ✅ NEW
│   ├── scenarios/                     # Test scenarios for agents
│   ├── results/                       # Test results and reports
│   │   └── agent-testing-report.md    # Comprehensive test report
│   ├── sandbox/                       # Safe test output area
│   └── TESTING_SUMMARY.md             # Testing summary
│
├── specs/                             # Feature specifications
│   └── procurement-module-spec.md     # Example: Procurement module
│
├── product/                           # Product documentation
│   ├── mission.md                     # Product mission and vision
│   └── tech-stack.md                  # Technology stack
│
└── instructions/                      # Implementation instructions
    └── implementation-tasks.md        # Task implementation guide
```

## Specialized Agents

### 1. Implementer Agent (`implementer.md`)
**Purpose**: Full-stack implementation following FibreFlow standards

**When to use**:
```
"Use the implementer agent to build the Marketing Activations export feature"
```

**Capabilities**:
- Implements features following FibreFlow tech stack (Next.js, Neon DB, modular architecture)
- Follows coding standards (file size limits, API response format)
- Deploys to dev first, then production after approval
- Updates documentation automatically

### 2. Spec Writer Agent (`spec-writer.md`)
**Purpose**: Creates detailed technical specifications

**When to use**:
```
"Use the spec-writer agent to create a specification for the contractor onboarding feature"
```

**Capabilities**:
- Writes comprehensive specs (database schema, API endpoints, UI components)
- Follows FibreFlow patterns (modular architecture, direct SQL, flattened API routes)
- Includes error handling and edge cases
- Defines success criteria and testing requirements

### 3. VPS Deployment Agent (`vps-deployment.md`)
**Purpose**: Manages VPS deployments and service monitoring

**When to use**:
```
"Use the vps-deployment agent to deploy the latest changes to production"
"Use the vps-deployment agent to investigate why the production site is down"
```

**Capabilities**:
- Dual environment deployment (production + development)
- PM2 process management
- Nginx configuration
- Service health monitoring
- Troubleshooting and rollback procedures

### 4. WA Agent (`wa-agent.md`)
**Purpose**: WhatsApp Monitor expert for diagnostics and troubleshooting

**When to use**:
```
"Use the wa-agent to check why Mohadin drops are being rejected"
"Use the wa-agent to add a new WhatsApp group to monitoring"
```

**Capabilities**:
- Diagnoses WA Monitor issues (LID bugs, validation problems, service failures)
- Performs database queries on qa_photo_reviews table
- Manages VPS services (wa-monitor-prod, wa-monitor-dev, whatsapp-bridge)
- Adds new projects to monitoring (5-minute process)
- Provides step-by-step troubleshooting

## 🎯 Which Agent Should I Use?

**Not sure which agent to use?** See the **[Agent Selection Guide](AGENT_SELECTION_GUIDE.md)** for:

- Quick decision tree
- Detailed selection matrix
- Common scenarios
- Time estimates
- Good vs. poor agent selection examples

### Quick Reference

| Your Task | Agent to Use | Time |
|-----------|-------------|------|
| 📝 Writing a spec | **spec-writer** | 2-3 hours |
| 💻 Building a feature | **implementer** | 1.5-3 hours |
| 🚀 Deploying to VPS | **vps-deployment** | 15-20 min |
| 📱 WA Monitor issue | **wa-agent** | 2-10 min |
| 🔍 Complex research | **general-purpose** | Variable |

### Visual Guides Available

**Need flowcharts?** See **[Visual Guides](VISUAL_GUIDES.md)** for:

- Feature Implementation Workflow (with timing)
- Specification Writing Workflow
- VPS Deployment Flow (dev → prod)
- WA Monitor Troubleshooting Decision Tree
- Module Creation Flowchart
- API Route Design Decision Tree

## Workflows

### Implementation Workflows (`workflows/implementation/`)
- **implement-tasks.md** - Complete implementation process (customized for FibreFlow)
- **create-tasks-list.md** - Breaking down features into tasks
- **verification/** - Testing and verification procedures

### Planning Workflows (`workflows/planning/`)
- **gather-product-info.md** - Product research and analysis
- **create-product-roadmap.md** - Roadmap planning
- **create-product-tech-stack.md** - Technology stack decisions

### Specification Workflows (`workflows/specification/`)
- **write-spec.md** - Writing technical specifications
- **verify-spec.md** - Specification validation
- **research-spec.md** - Research for specifications

## Standards

### API Response Format (`standards/api-response-format.md`)
Standardized API response structure using `lib/apiResponse.ts` helper:

```typescript
// Success
{ success: true, data: {...}, meta: { timestamp: "..." } }

// Error
{ success: false, error: { code: "...", message: "..." }, meta: { timestamp: "..." } }
```

### Modular Architecture (`standards/modular-architecture.md`)
"Lego block" pattern for self-contained, plug-and-play modules:

```
src/modules/{module-name}/
├── types/
├── services/
├── utils/
├── components/
└── hooks/
```

### Deployment Workflow (`standards/deployment-workflow.md`)
Professional dual-environment deployment:

```
feature → develop → dev.fibreflow.app (test) → master → app.fibreflow.app (production)
```

## How to Use Agent OS

### Invoking Specialized Agents

```typescript
// In Claude Code, use the Task tool to invoke agents
<Task>
  <subagent_type>implementer</subagent_type>
  <prompt>
    Implement the CSV export feature for Marketing Activations dashboard.
    Follow the specification in .agent-os/specs/marketing-export-spec.md
  </prompt>
</Task>
```

### Following Workflows

Workflows are referenced automatically by agents, but you can also reference them explicitly:

```markdown
Follow the workflow in .agent-os/workflows/implementation/implement-tasks.md to implement this feature.
```

### Applying Standards

Standards are automatically applied by agents, but you can reference them:

```markdown
Ensure the API follows the standards in .agent-os/standards/api-response-format.md
```

## Integration with CLAUDE.md

Agent OS complements (doesn't replace) CLAUDE.md:

- **CLAUDE.md**: Complete project context, history, and comprehensive documentation (8,900+ lines)
- **Agent OS**: Focused, actionable guidance for specific tasks and agent roles

**Relationship**:
- Agent OS agents **reference** CLAUDE.md for project context
- CLAUDE.md **references** Agent OS for structured workflows
- Both work together to provide complete AI assistant guidance

## Creating New Agents

To create a new specialized agent:

1. **Create agent file** in `.agent-os/agents/{agent-name}.md`

2. **Define metadata**:
   ```markdown
   ---
   name: agent-name
   description: What this agent does and when to use it
   tools: "*"
   color: blue
   model: inherit
   ---
   ```

3. **Document expertise**:
   - Core responsibilities
   - Domain knowledge
   - Critical commands
   - Common tasks
   - Troubleshooting procedures

4. **Register in CLAUDE.md**:
   - Add agent to "Available Agents" section
   - Document when to invoke the agent
   - Provide usage examples

## Creating New Workflows

To create a new workflow:

1. **Create workflow file** in `.agent-os/workflows/{category}/{workflow-name}.md`

2. **Document process**:
   - Step-by-step instructions
   - FibreFlow-specific considerations
   - Commands and examples
   - Success criteria

3. **Reference from agents**:
   - Agents can reference workflows in their instructions
   - Example: `{{workflows/implementation/implement-tasks}}`

## Creating New Standards

To create a new standard:

1. **Extract from CLAUDE.md** (if not already documented)

2. **Create focused standard file** in `.agent-os/standards/{standard-name}.md`

3. **Document**:
   - Standard description
   - Best practices
   - Examples (good and bad)
   - Migration guide (if replacing old pattern)

4. **Reference in agents and workflows**:
   - Agents automatically apply standards
   - Workflows reference standards where applicable

## Maintenance

### Keeping Agent OS Up to Date

- **When CLAUDE.md changes**: Update relevant agents/standards/workflows
- **When adding features**: Create/update specifications in `.agent-os/specs/`
- **When patterns change**: Update standards documentation
- **When agents improve**: Enhance agent expertise and capabilities

### Sync with Main Project

Agent OS should stay synchronized with:
- CLAUDE.md (master context document)
- docs/ (project documentation)
- src/ (codebase patterns)
- VPS deployment procedures

## Benefits of Agent OS

1. **Structured Workflows**: Step-by-step processes for common tasks
2. **Specialized Agents**: Domain experts for specific tasks (WA Monitor, VPS deployment)
3. **Focused Standards**: Easy-to-find coding patterns and best practices
4. **Reproducible Results**: Consistent implementation across features
5. **Knowledge Retention**: Captured workflows and procedures
6. **Team Collaboration**: Clear patterns for multiple developers/AI assistants

## Comparison: Agent OS vs. CLAUDE.md

| Aspect | CLAUDE.md | Agent OS |
|--------|-----------|----------|
| **Purpose** | Complete project context | Structured workflows and agents |
| **Length** | 8,900+ lines | Focused files (50-500 lines each) |
| **Usage** | Reference for all context | Task-specific guidance |
| **Maintenance** | Single file | Modular files |
| **AI Assistant** | Read for context | Follow for processes |
| **Audience** | All AI assistants | Specialized agents |

**Both are essential** - CLAUDE.md provides context, Agent OS provides structure.

## Getting Started

### For AI Assistants

1. **Read CLAUDE.md** for complete project context
2. **Review .agent-os/README.md** (this file) for Agent OS overview
3. **Use specialized agents** for domain-specific tasks
4. **Follow workflows** for structured implementation
5. **Apply standards** for consistent code quality

### For Developers

1. **Reference agents** when asking AI for help:
   - "Use the wa-agent to diagnose this WhatsApp issue"
   - "Use the implementer agent to build this feature"

2. **Create specifications** in `.agent-os/specs/` before implementation

3. **Follow deployment workflow** for professional releases

4. **Update Agent OS** when patterns change

## Version History

- **December 5, 2025**: Initial Agent OS integration
  - Added 4 specialized agents (implementer, spec-writer, vps-deployment, wa-agent)
  - Copied 15 workflow templates from Agent OS project
  - Customized implementation workflow for FibreFlow
  - Extracted 3 core standards (API response, modular architecture, deployment)
  - Created comprehensive documentation

## Future Enhancements

- [ ] Add code-reviewer agent for automated code reviews
- [ ] Add database-migration agent for schema changes
- [ ] Add testing agent for comprehensive test coverage
- [ ] Create more FibreFlow-specific workflow templates
- [ ] Extract additional standards from CLAUDE.md
- [ ] Integrate with CI/CD pipeline (future)

## Questions?

For questions about Agent OS:
- See CLAUDE.md for project context
- See docs/ for detailed documentation
- Reference specific agent files for domain expertise
- Check workflow files for process guidance
