# VLM Optimization Plan & Progress Tracker

## 🎯 Goal

Reduce DR photo evaluation time from **180 seconds to <60 seconds** (3x improvement)

## 📊 Current State

**Baseline**: 180 seconds for 16 photos
- Photo fetching: 8s
- Base64 encoding: 3s
- **VLM processing: 161s** ← PRIMARY BOTTLENECK
- Result merging: 1s
- Database save: 7s

## 🚀 Optimization Phases

### ✅ Phase 0: Baseline & Benchmarking

**Status**: COMPLETED
**Date**: December 17, 2025
**Results**:
- Established baseline: 180s
- Identified bottleneck: Sequential batch processing (161s / 89%)
- Created benchmark suite

---

### 🔥 Phase 1: Parallel Batch Processing

**Status**: 🟢 IN PROGRESS
**Priority**: P0 (Highest Impact)
**Estimated Impact**: 180s → 45s (4x improvement)
**Effort**: 1 hour

#### Implementation

**File**: `src/modules/foto-review/services/fotoVlmService.ts`

**Current Code** (Sequential):
```typescript
for (let i = 0; i < batches.length; i++) {
  const vlmResponse = await callVlmApi(drNumber, batches[i]);
  const evaluation = parseVlmResponse(drNumber, vlmResponse);
  batchEvaluations.push(evaluation);
}
```

**Optimized Code** (Parallel):
```typescript
const batchPromises = batches.map(async (batch, i) => {
  log.info('VlmService', `Starting batch ${i + 1}/${batches.length}`);
  const vlmResponse = await callVlmApi(drNumber, batch);
  return parseVlmResponse(drNumber, vlmResponse);
});

const batchEvaluations = await Promise.all(batchPromises);
```

#### Testing Checklist

- [ ] Update code with parallel processing
- [ ] Add error handling for failed batches
- [ ] Add timing logs for each batch
- [ ] Deploy to staging
- [ ] Run benchmark test (DR1730550)
- [ ] Verify results match sequential version
- [ ] Check memory usage (4 concurrent VLM calls)
- [ ] Deploy to production
- [ ] Monitor for 24 hours

#### Success Criteria

- ✅ Total time < 60s
- ✅ All batches complete successfully
- ✅ Results identical to sequential version
- ✅ No memory issues

#### Rollback Plan

```bash
git revert HEAD
cd ~/apps/fibreflow && git pull && npm run build
pkill -f "next" && PORT=3005 npm start
```

---

### 🟡 Phase 2: Image Compression

**Status**: ⏳ PLANNED
**Priority**: P1
**Estimated Impact**: 45s → 32s (30% improvement)
**Effort**: 2 hours
**Start Date**: After Phase 1 completes

#### Implementation Plan

1. Add image resizing library
   ```bash
   npm install sharp
   ```

2. Compress images before base64 encoding
   ```typescript
   import sharp from 'sharp';

   async function compressImage(imageBuffer: Buffer): Promise<Buffer> {
     return await sharp(imageBuffer)
       .resize(800, null, { fit: 'inside' })
       .jpeg({ quality: 85 })
       .toBuffer();
   }
   ```

3. Update `fetchImageAsBase64` to compress

#### Success Criteria

- ✅ Image payload reduced by 70-80%
- ✅ Total time < 35s
- ✅ VLM accuracy unchanged
- ✅ Images still readable/usable

---

### 🟡 Phase 3: Selective Photo Evaluation

**Status**: ⏳ PLANNED
**Priority**: P1
**Estimated Impact**: 32s → 16s (2x improvement)
**Effort**: 3 hours
**Start Date**: TBD

#### Implementation Plan

1. Define critical vs optional photos
   ```typescript
   const CRITICAL_STEPS = [
     'ont_barcode',    // Must verify ONT serial
     'green_lights',   // Must verify operational
     'power_meter',    // Must verify signal
     'cable_entry',    // Must verify installation
     'final_install',  // Must verify complete
     'house_photo'     // Must verify location
   ];
   ```

2. Filter photos by importance
   ```typescript
   const criticalPhotos = photoUrls.filter(url =>
     CRITICAL_STEPS.some(step => url.includes(step))
   );
   ```

3. Add UI toggle for "Full Evaluation" vs "Quick Evaluation"

#### Success Criteria

- ✅ Quick evaluation uses 6-8 photos (vs 16)
- ✅ Total time < 20s for quick mode
- ✅ Accuracy > 85% for quick mode
- ✅ Full mode still available

---

### 🔥 Phase 4: Response Caching

**Status**: ⏳ PLANNED
**Priority**: P0 (for repeat evaluations)
**Estimated Impact**: <5s for cached results
**Effort**: 4 hours
**Start Date**: TBD

#### Implementation Plan

1. Add Redis caching
   ```typescript
   const cacheKey = `vlm:eval:${drNumber}`;
   const cached = await redis.get(cacheKey);

   if (cached) {
     return JSON.parse(cached);
   }

   const evaluation = await executeVlmEvaluation(drNumber);
   await redis.setex(cacheKey, 86400, JSON.stringify(evaluation)); // 24h
   ```

2. Add cache invalidation
   - Manual: "Re-evaluate" button
   - Auto: When photos change

#### Success Criteria

- ✅ Cached evaluations return < 5s
- ✅ Cache hit rate > 50% after 1 week
- ✅ Stale data handling works
- ✅ Manual invalidation works

---

### 🟡 Phase 5: Background Processing

**Status**: ⏳ PLANNED
**Priority**: P2 (UX enhancement)
**Estimated Impact**: 0s perceived wait time
**Effort**: 8 hours
**Start Date**: TBD

#### Implementation Plan

1. Add job queue (Bull/BullMQ)
2. Queue evaluation requests
3. Return immediately with job ID
4. WebSocket or polling for status updates
5. Notification when complete

#### Success Criteria

- ✅ Immediate UI response
- ✅ Real-time progress updates
- ✅ Notification on completion
- ✅ Queue processing rate > evaluation rate

---

## 📈 Progress Tracking

### Performance Timeline

| Phase | Target Time | Status | Actual Time | Date Completed |
|-------|-------------|--------|-------------|----------------|
| Baseline | 180s | ✅ | 180s | Dec 17, 2025 |
| Phase 1 | 45s | 🟢 | TBD | TBD |
| Phase 2 | 32s | ⏳ | - | - |
| Phase 3 | 16s | ⏳ | - | - |
| Phase 4 | <5s (cached) | ⏳ | - | - |
| Phase 5 | 0s (perceived) | ⏳ | - | - |

### Cumulative Improvements

```
Baseline:  ████████████████████ 180s
Phase 1:   █████ 45s (-135s, 75% reduction)
Phase 2:   ███ 32s (-13s, 29% reduction from P1)
Phase 3:   ██ 16s (-16s, 50% reduction from P2)
Phase 4:   ▏<5s (cached evaluations)
Phase 5:   Instant (background processing)
```

## 🧪 Testing Strategy

### Before Each Phase

1. Run baseline benchmark
2. Document current performance
3. Create feature branch

### During Implementation

1. Add performance logging
2. Test with multiple DRs
3. Monitor memory/CPU usage

### After Each Phase

1. Run full benchmark suite
2. Compare to previous phase
3. Document improvements
4. Deploy to production
5. Monitor for 48 hours

### Benchmark Test Cases

| DR Number | Photos | Expected Time (Baseline) | Expected Time (Phase 1) |
|-----------|--------|--------------------------|-------------------------|
| DR1730550 | 16 | 180s | 45s |
| DR1733758 | 7 | 90s | 25s |
| DR1734014 | 13 | 150s | 40s |

## 🔍 Monitoring

### Key Metrics to Track

1. **Performance**
   - Average evaluation time
   - P50, P95, P99 latency
   - Batch processing time
   - API response times

2. **Quality**
   - Evaluation accuracy (vs manual)
   - Error rate
   - Retry rate

3. **Resources**
   - Memory usage
   - CPU utilization
   - API rate limits
   - Cache hit rate

### Alerts

- ⚠️ Evaluation time > 120s
- ⚠️ Error rate > 5%
- 🔥 Memory usage > 90%
- 🔥 VLM API errors

## 📝 Change Log

### December 17, 2025
- Created baseline benchmarks
- Established optimization plan
- Started Phase 1 implementation

---

## 🎓 Lessons Learned

*To be updated after each phase*

### Phase 1
- TBD

### Phase 2
- TBD

---

**Last Updated**: December 17, 2025
**Current Phase**: Phase 1 (Parallel Batch Processing)
**Next Milestone**: <60s evaluation time
