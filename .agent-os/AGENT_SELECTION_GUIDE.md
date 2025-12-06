# Agent Selection Guide

Quick reference for choosing the right agent for your task.

## Quick Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                 WHICH AGENT SHOULD I USE?                       │
└─────────────────────────────────────────────────────────────────┘

What do you need to do?

├─ 📝 Write a specification document
│  └─→ USE: spec-writer agent
│      Time: 2-3 hours
│      Output: Complete technical specification
│
├─ 💻 Implement a feature (write code)
│  └─→ USE: implementer agent
│      Time: 1.5-3 hours
│      Output: Working feature deployed to production
│
├─ 🚀 Deploy to VPS
│  └─→ USE: vps-deployment agent
│      Time: 15-20 minutes
│      Output: Code deployed to dev/production
│
├─ 📱 WA Monitor issue
│  └─→ USE: wa-agent
│      Time: 2-10 minutes
│      Output: Issue diagnosed and fixed
│
└─ 🔍 Complex multi-step task or search
   └─→ USE: general-purpose agent
       Time: Variable
       Output: Research results or completed task
```

## Detailed Agent Selection Matrix

| Your Need | Agent to Use | When to Use | Time Estimate |
|-----------|-------------|-------------|---------------|
| **Planning a new feature** | spec-writer | Before implementation, need detailed specification | 2-3 hours |
| **Building a feature** | implementer | Have spec, ready to write code | 1.5-3 hours |
| **Deploying code** | vps-deployment | Code tested locally, ready for dev/prod | 15-20 min |
| **Drop missing from dashboard** | wa-agent | WA Monitor data issues | 2-5 min |
| **Service not running** | wa-agent OR vps-deployment | Depends on which service (WA Monitor vs. app) | 2-10 min |
| **Adding new WA group** | wa-agent | Need to monitor new WhatsApp group | 5 min |
| **Searching codebase** | general-purpose | Need to find implementations across files | 10-20 min |
| **Database schema question** | spec-writer | Planning database changes | 30-60 min |
| **API endpoint design** | spec-writer | Designing API before implementation | 30-45 min |
| **Fixing a bug** | implementer | Bug identified, need to fix code | 15-60 min |
| **Code refactoring** | implementer | Improving existing code | 1-4 hours |
| **Production issue** | vps-deployment | App down, 502 error, etc. | 5-15 min |
| **Validation not working** | wa-agent | Mohadin drops being rejected | 3-5 min |

## Agent Capability Comparison

| Capability | spec-writer | implementer | vps-deployment | wa-agent |
|------------|------------|------------|----------------|----------|
| **Write specifications** | ✅ Primary | ❌ | ❌ | ❌ |
| **Write code** | ❌ | ✅ Primary | ❌ | ❌ |
| **Deploy to VPS** | ❌ | ✅ Supports | ✅ Primary | ❌ |
| **Database queries** | ✅ Design | ✅ Implement | ❌ | ✅ WA Monitor only |
| **Troubleshoot services** | ❌ | ❌ | ✅ VPS services | ✅ WA Monitor only |
| **Research patterns** | ✅ | ✅ | ❌ | ✅ WA Monitor only |
| **Documentation** | ✅ Specs | ✅ Updates | ✅ Deployment | ✅ WA Monitor |

## Common Scenarios

### Scenario 1: New Feature from Scratch

**Steps**:
1. **spec-writer** → Create comprehensive specification
2. **implementer** → Implement feature following spec
3. **vps-deployment** → Deploy to dev → test → production

**Total Time**: 4-6 hours

### Scenario 2: Quick Bug Fix

**Steps**:
1. **implementer** → Fix bug in code
2. **vps-deployment** → Deploy to dev → test → production

**Total Time**: 30-90 minutes

### Scenario 3: WA Monitor Issue

**Steps**:
1. **wa-agent** → Diagnose issue → Provide fix
2. (Optional) **vps-deployment** → Restart services if needed

**Total Time**: 5-15 minutes

### Scenario 4: Planning Before Implementation

**Steps**:
1. **spec-writer** → Design feature with database, APIs, UI
2. Get user approval on specification
3. **implementer** → Implement based on approved spec
4. **vps-deployment** → Deploy to production

**Total Time**: 5-8 hours (includes approval time)

## Agent Selection Examples

### ✅ Good Agent Selection

```
User: "I want to add a notification system when contractor status changes"
AI: "Let me use the spec-writer agent to create a detailed specification first."
└─→ Correct: Start with planning
```

```
User: "The spec is approved, let's build it"
AI: "I'll use the implementer agent to build the notification system."
└─→ Correct: Implementation phase
```

```
User: "Deploy the notification system to production"
AI: "I'll use the vps-deployment agent to deploy after testing on dev."
└─→ Correct: Deployment phase
```

```
User: "DR1234567 is missing from the dashboard"
AI: "Let me use the wa-agent to investigate this drop."
└─→ Correct: WA Monitor specific issue
```

### ❌ Poor Agent Selection

```
User: "Build a new contractor onboarding flow"
AI: "Let me start implementing it immediately"
└─→ Wrong: Should use spec-writer first for planning
```

```
User: "Create a specification for the export feature"
AI: "I'll use the implementer agent to design it"
└─→ Wrong: Should use spec-writer for specifications
```

```
User: "Deploy to production"
AI: "I'll use the implementer agent to deploy"
└─→ Wrong: Should use vps-deployment for deployments
```

```
User: "Validation is rejecting valid Mohadin drops"
AI: "Let me use the general-purpose agent to investigate"
└─→ Wrong: Should use wa-agent for WA Monitor issues
```

## Decision-Making Questions

### Question 1: "Do I have a specification yet?"

- **NO** → Use **spec-writer** to create one first
- **YES** → Use **implementer** to build it

### Question 2: "Is this related to WhatsApp Monitor?"

- **YES** → Use **wa-agent**
- **NO** → Continue to next question

### Question 3: "Am I deploying code or managing services?"

- **YES** → Use **vps-deployment**
- **NO** → Use **implementer** or **spec-writer**

### Question 4: "Is this a complex research task?"

- **YES** → Use **general-purpose**
- **NO** → Use specific agent for the task

## Agent Invocation Syntax

### For AI Assistants

When you're an AI assistant reading this:

```markdown
# Using spec-writer
"I'll use the spec-writer guidance from .agent-os/agents/spec-writer.md to create this specification."

# Using implementer
"I'll use the implementer guidance from .agent-os/agents/implementer.md to implement this feature."

# Using vps-deployment
"I'll use the vps-deployment guidance from .agent-os/agents/vps-deployment.md to deploy this."

# Using wa-agent (if registered as built-in)
<Task subagent_type="wa-agent">
  Investigate missing drop DR1234567 from Lawley
</Task>
```

### For Users

When asking Claude Code for help:

```markdown
# For specifications
"Use the spec-writer to create a specification for [feature]"

# For implementation
"Use the implementer to build [feature]"

# For deployment
"Use the vps-deployment agent to deploy to [dev/production]"

# For WA Monitor
"Use the wa-agent to investigate [WA Monitor issue]"
```

## Time Planning Guide

### Estimation by Agent

| Agent | Typical Time | Range |
|-------|-------------|-------|
| **spec-writer** | 2-3 hours | 30 min - 3 hours |
| **implementer** | 1.5-3 hours | 15 min - 8 hours |
| **vps-deployment** | 15-20 min | 5 min - 45 min |
| **wa-agent** | 2-5 min | 1 min - 15 min |

### Feature Development Timeline

**Simple Feature** (form, simple CRUD):
- spec-writer: 30-45 min
- implementer: 1-2 hours
- vps-deployment: 15-20 min
- **Total**: 2-3 hours

**Medium Feature** (module with database):
- spec-writer: 1.5-2 hours
- implementer: 3-5 hours
- vps-deployment: 15-20 min
- **Total**: 5-7 hours

**Complex Feature** (multiple modules, integration):
- spec-writer: 2-3 hours
- implementer: 6-10 hours
- vps-deployment: 15-20 min
- **Total**: 8-13 hours

## Quick Reference Cards

### 📝 spec-writer Agent

**Use for**:
- Creating technical specifications
- Database schema design
- API endpoint planning
- UI component design
- Error handling planning

**Outputs**:
- Complete specification document
- Database schema with types
- API request/response formats
- Component structure
- Testing requirements

**Time**: 2-3 hours

### 💻 implementer Agent

**Use for**:
- Writing production code
- Implementing features
- Bug fixes
- Code refactoring
- API endpoint creation

**Outputs**:
- Working code deployed to production
- Database migrations
- API endpoints
- UI components
- Updated documentation

**Time**: 1.5-3 hours

### 🚀 vps-deployment Agent

**Use for**:
- Deploying to dev/production
- Service management (PM2, Nginx)
- Health checks
- Troubleshooting deployments
- Rollbacks

**Outputs**:
- Code deployed successfully
- Services running
- Verification completed
- Logs checked

**Time**: 15-20 minutes

### 📱 wa-agent Agent

**Use for**:
- Drop investigations
- Validation issues
- Service health checks
- Adding new WhatsApp groups
- LID bug fixes

**Outputs**:
- Issue diagnosed
- Root cause identified
- Fix provided
- Services restored

**Time**: 2-10 minutes

## Best Practices

### ✅ Do This

1. **Start with spec-writer** for new features
2. **Use implementer** only after spec is approved
3. **Deploy to dev first** with vps-deployment agent
4. **Use wa-agent** for all WA Monitor issues
5. **Plan before implementing**

### ❌ Avoid This

1. **Don't skip specification** phase for complex features
2. **Don't deploy directly to production** without dev testing
3. **Don't use wrong agent** for the task
4. **Don't mix agent responsibilities**
5. **Don't rush through planning**

## Summary

**Golden Rule**: Choose the agent that matches your task phase:
- **Planning** → spec-writer
- **Building** → implementer
- **Deploying** → vps-deployment
- **WA Monitor** → wa-agent
- **Research** → general-purpose

**When in doubt**: Ask yourself "What is the primary goal right now?" and choose the agent that specializes in that goal.
