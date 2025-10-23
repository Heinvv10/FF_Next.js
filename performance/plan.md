# Performance Improvement Plan

## Principles
- **First Principles**: Measure → Identify → Fix → Verify
- **80/20 Rule**: Focus on the 20% of issues causing 80% of slowness
- **One Thing**: Fix one bottleneck at a time

---

## Phase 1: Measure (Week 1)
- [ ] Set up Lighthouse CI
- [ ] Capture baseline metrics
- [ ] Identify slowest pages/APIs
- [ ] Profile database queries

## Phase 2: Quick Wins (Week 2)
- [ ] Fix #1 bottleneck
- [ ] Verify impact
- [ ] Document learning

## Phase 3: Optimize (Week 3)
- [ ] Fix #2 bottleneck
- [ ] Verify impact
- [ ] Document learning

## Phase 4: Scale (Week 4)
- [ ] Fix #3 bottleneck
- [ ] Verify impact
- [ ] Document learning

---

## Quick Win Checklist
**Before optimizing**, check these common issues:
- [ ] Missing database indexes
- [ ] N+1 queries
- [ ] Unoptimized images
- [ ] Large bundle sizes
- [ ] Missing caching
- [ ] Blocking requests
