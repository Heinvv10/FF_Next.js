# FibreFlow Constitution

## Core Principles

### I. Code Quality First
Code quality is the foundation of sustainable development. All features must be built with clean, maintainable, and well-documented code. Performance is critical but never at the expense of code integrity. Development speed follows naturally from high-quality foundations.

### II. Modular Architecture Excellence
The project follows a Module-First architecture where each domain area (clients, projects, contractors, etc.) is organized as a self-contained module. Modules must have clear boundaries, defined interfaces, and independent testability. Shared functionality must be abstracted to reusable utilities.

### III. Build-Test-Learn Development Cycle
Development follows the Build-Test-Learn methodology:
1. **Build**: Create functional features with working prototypes
2. **Test**: Validate behavior through comprehensive testing (unit, integration, e2e)
3. **Learn**: Analyze results, gather feedback, and refine the implementation
This cycle emphasizes rapid iteration while maintaining quality through validation.

### IV. TypeScript Safety & Direct Database Access
TypeScript is mandatory for all code - no JavaScript allowed. Database interactions use direct SQL with the Neon PostgreSQL client. No ORM abstraction layers are permitted. All database queries must use parameterized queries and follow security best practices.

### V. Documentation as Living Artifact
Documentation is not an afterthought but an integral part of the development process. All significant changes must be documented in the appropriate page logs. The CLAUDE.md file serves as the single source of truth for project context and AI assistant guidance.

### VI. Independent Development with Periodic Syncs
Team members work independently on features and modules with clear ownership. Regular syncs ensure alignment and knowledge sharing. Code reviews are lightweight and focused on key architectural decisions rather than style preferences.

### VII. Rock-Solid Stability
The system prioritizes stability and reliability over cutting-edge features. All changes must be backward-compatible where possible. Breaking changes require thorough justification and migration planning. The production environment must remain stable and predictable.

## Technical Standards

### File Organization
- Keep files under 300 lines (enforces better organization)
- Components should be < 200 lines
- Extract business logic to custom hooks
- Keep only UI logic in components

### Type Organization
- Group types by module (e.g., `types/procurement/base.types.ts`)
- Use interfaces for object shapes, types for primitives/unions
- Strict TypeScript configuration with no implicit any

### Database Patterns
- Use `@neondatabase/serverless` for direct SQL queries
- All queries must use template literals with parameter binding
- Database operations are handled through domain-specific services
- Migrations are managed through custom scripts in `scripts/migrations/`

### Testing Requirements
- Unit tests for utilities and complex logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Tests must run successfully before deployment

## Development Workflow

### Local Development
```bash
# Always use production mode for local development
npm run build
PORT=3005 npm start
```

### Code Changes
1. Make changes to appropriate module
2. Update relevant page logs in `docs/page-logs/`
3. Run tests and type checking
4. Rebuild and test locally
5. Commit with clear, descriptive messages

### Database Changes
1. Create migration script in `scripts/migrations/`
2. Test migration thoroughly
3. Update relevant service files
4. Document changes in appropriate page logs

## Quality Gates

### Before Commit
- All tests must pass
- TypeScript type checking must succeed
- ESLint must pass with no warnings
- Build must complete successfully

### Before Deployment
- Integration tests must pass
- E2E tests for critical features must pass
- Database migrations must be tested
- Performance regression checks must pass

## Governance

### Amendment Process
1. Proposed amendments must be documented with clear rationale
2. Team review and discussion period (minimum 3 days)
3. Consensus required for principle changes
4. Update documentation and communicate changes

### Version Control
- **MAJOR**: Backward incompatible governance or principle removals
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance
- All PRs must verify compliance with constitution principles
- Complexity must be justified with clear business value
- Use CLAUDE.md and relevant page logs for development guidance
- Anti-hallucination validation must pass for all AI-generated code

## Security Requirements

### Authentication & Authorization
- Clerk authentication must be used for all user-facing features
- Role-based access control must be implemented for sensitive operations
- All API routes must include authentication middleware

### Data Protection
- User data must be encrypted in transit and at rest
- Database credentials must use environment variables
- No sensitive information in logs or error messages

### Code Security
- All user inputs must be validated and sanitized
- SQL injection prevention through parameterized queries
- Regular security audits and dependency updates

## Performance Standards

### Response Times
- API responses must be < 2 seconds for 95% of requests
- Database queries must be optimized with appropriate indexes
- Frontend interactions must feel instantaneous (< 100ms)

### Scalability
- Architecture must support horizontal scaling
- Database queries must be efficient and avoid N+1 patterns
- Frontend must implement proper loading states and error handling

## Success Metrics

### Code Quality
- Test coverage > 80%
- TypeScript strict mode compliance
- ESLint zero warnings policy
- Code review acceptance rate > 90%

### Team Productivity
- Feature delivery time < 2 weeks for medium complexity
- Bug fix resolution < 24 hours for critical issues
- Documentation completeness for all features

### System Reliability
- Uptime > 99.5%
- Error rate < 0.1%
- Performance regression detection and resolution

---
**Version**: 1.0.0 | **Ratified**: 2025-09-23 | **Last Amended**: 2025-09-23