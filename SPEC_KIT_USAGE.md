# GitHub Spec Kit Usage Guide

## 🚀 How to Use the Spec Kit

The Spec Kit is now fully implemented in your project! Here's how to use it:

### Method 1: Using npm script
```bash
npm run spec-kit <command>
```

### Method 2: Using the direct script
```bash
./spec-kit <command>
```

### Method 3: Using the wrapper script
```bash
./spec.sh <command>
```

## Available Commands

### `/constitution` - Create Project Constitution
```bash
./spec-kit constitution
```
Interactive prompt to create your project's constitution with core principles, governance rules, and version control.

### `/specify` - Create Specifications
```bash
./spec-kit specify
```
Interactive prompt to create detailed specifications for features, including purpose, scope, requirements, and acceptance criteria.

### `/plan` - Create Implementation Plans
```bash
./spec-kit plan
```
Interactive prompt to create implementation plans with phases, tasks, dependencies, and timelines.

### `/tasks` - Generate Task Lists
```bash
./spec-kit tasks
```
Interactive prompt to generate detailed task lists with priorities, estimates, and acceptance criteria.

### `/analyze` - Analyze Project Alignment
```bash
./spec-kit analyze
```
Analyze your project's current state and get recommendations for next steps.

### `/help` - Show Help
```bash
./spec-kit help
```
Show all available commands and usage instructions.

## Project Structure

The Spec Kit creates and manages these directories:
- `.specify/memory/` - Stores project constitution and guidelines
- `.specify/templates/` - Contains templates for specs, plans, and tasks
- `specs/` - Your project specifications
- `plans/` - Implementation plans
- `tasks/` - Task lists and breakdowns

## Workflow Example

1. **Start with constitution** (once per project):
   ```bash
   ./spec-kit constitution
   ```

2. **Create specifications** for new features:
   ```bash
   ./spec-kit specify
   ```

3. **Create implementation plans**:
   ```bash
   ./spec-kit plan
   ```

4. **Generate task lists**:
   ```bash
   ./spec-kit tasks
   ```

5. **Analyze progress**:
   ```bash
   ./spec-kit analyze
   ```

## Integration with AI Assistants

The `.claude/commands/` directory contains templates that AI assistants can use to understand your project's spec-driven development approach. While not directly executable, these templates help AI agents provide better guidance when using the Spec Kit methodology.

## Next Steps

Try running:
```bash
./spec-kit analyze
```

This will show you your current project status and recommend next steps!