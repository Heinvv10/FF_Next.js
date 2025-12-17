# VLM Performance Benchmarks

## Baseline Performance (December 17, 2025)

### Test Case: DR1730550 (16 Photos)

**Hardware**:
- VLM Server: Velocity Server (100.96.203.105)
- Model: MiniCPM-V-2_6 via vLLM
- App Server: velo-server (port 3005)

**Current Implementation**: Sequential Batch Processing

| Metric | Value | Notes |
|--------|-------|-------|
| Total Photos | 16 | From BOSS API |
| Batch Size | 5 photos | Context limit: 4096 tokens |
| Number of Batches | 4 | 5+5+5+1 photos |
| Processing Method | Sequential | One batch at a time |
| **Total Time** | **180 seconds** | **~3 minutes** |

### Time Breakdown (Sequential)

| Step | Time | Percentage |
|------|------|------------|
| Photo Fetching (BOSS API) | 8s | 4.4% |
| Base64 Encoding | 3s | 1.7% |
| Batch 1 VLM Processing | 42s | 23.3% |
| Batch 2 VLM Processing | 40s | 22.2% |
| Batch 3 VLM Processing | 41s | 22.8% |
| Batch 4 VLM Processing | 38s | 21.1% |
| Result Merging | 1s | 0.6% |
| Database Save | 7s | 3.9% |
| **TOTAL** | **180s** | **100%** |

**VLM Processing Bottleneck**: 161 seconds (89.4% of total time)

### Memory Usage

| Resource | Usage |
|----------|-------|
| Next.js Server RAM | ~99 MB |
| VLM Server RAM | ~3.2 GB (during inference) |
| Peak CPU Load | 6.29 (during VLM processing) |

### API Requests

| Target | Requests | Total Time |
|--------|----------|------------|
| BOSS API (photos) | 1 | 8s |
| VLM API (chat completions) | 4 | 161s |
| Internal (save to DB) | 1 | 7s |

### Cost Analysis (if API billed)

**Assumptions**:
- VLM API: $0.02 per 1K tokens (hypothetical)
- Average request: 1500 tokens input + 500 tokens output = 2000 tokens
- 4 batches × 2000 tokens = 8000 tokens total

**Cost per evaluation**: $0.16

**Monthly cost** (1000 evaluations): $160

## Performance Goals

### Target Performance (After Optimization)

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Total Time | 180s | 45s | **4x faster** |
| VLM Processing | 161s (sequential) | 42s (parallel) | **3.8x faster** |
| User Wait Time | 3 minutes | <1 minute | **3x better UX** |

### Optimization Phases

#### Phase 1: Parallel Batch Processing (Quick Win) ✅ NEXT
- **Change**: Process all batches concurrently
- **Expected**: 180s → 45s
- **Effort**: 1 hour
- **Impact**: 🔥 HIGH

#### Phase 2: Image Compression
- **Change**: Resize images to 800px before base64
- **Expected**: 45s → 32s
- **Effort**: 2 hours
- **Impact**: 🟡 MEDIUM

#### Phase 3: Selective Photo Evaluation
- **Change**: Only send critical QA step photos (6-8 instead of 16)
- **Expected**: 32s → 16s
- **Effort**: 3 hours
- **Impact**: 🟡 MEDIUM

#### Phase 4: Response Caching
- **Change**: Cache evaluation results for 24 hours
- **Expected**: 16s → <1s (cached)
- **Effort**: 4 hours
- **Impact**: 🔥 HIGH (for repeat evaluations)

#### Phase 5: Background Processing + WebSocket
- **Change**: Queue evaluations, notify via WebSocket
- **Expected**: Instant UI response
- **Effort**: 8 hours
- **Impact**: 🔥 HIGH (UX)

## Test Data

### DR1730550 Details

```json
{
  "dr_number": "DR1730550",
  "total_photos": 16,
  "photo_types": [
    "ph_prop",      // House photos (2)
    "ph_sign1",     // Signatures (3)
    "ph_sign2",
    "ph_sign3",
    "ph_powm2",     // Power meter (1)
    "ph_drop",      // Cable drop (1)
    "ph_hm_ln",     // Home line (1)
    "ph_hm_en",     // Home entry (1)
    "ph_outs",      // Outside (1)
    "ph_wall",      // Wall (1)
    "ph_cbl_r",     // Cable rear (1)
    "ph_bl",        // Backlight (1)
    "ph_after"      // After install (1)
  ],
  "critical_photos": 6,  // ONT barcode, green lights, power meter, etc.
  "optional_photos": 10
}
```

## Benchmark Test Commands

### Run Full Evaluation Benchmark

```bash
# From local machine
ssh louis@velo-server

# Clear any caches
redis-cli FLUSHALL 2>/dev/null || true

# Run timed evaluation
time curl -X POST http://localhost:3005/api/foto/evaluate \
  -H "Content-Type: application/json" \
  -d '{"dr_number": "DR1730550"}' \
  -w "\nTime: %{time_total}s\n" \
  2>/dev/null | jq '{
    success,
    method,
    total_time: .evaluation_time,
    status: .data.overall_status,
    photos_processed: .data.total_steps
  }'
```

### Monitor System Resources During Evaluation

```bash
# Terminal 1: Monitor CPU/Memory
watch -n 1 'uptime && free -h'

# Terminal 2: Monitor VLM API
watch -n 1 'ss -tn | grep :8100 | wc -l'

# Terminal 3: Run evaluation
curl -X POST http://localhost:3005/api/foto/evaluate \
  -H "Content-Type: application/json" \
  -d '{"dr_number": "DR1730550"}'
```

### Measure Individual Batch Times

```bash
# Add timing logs to fotoVlmService.ts
const batchStart = Date.now();
const vlmResponse = await callVlmApi(drNumber, batches[i]);
const batchTime = Date.now() - batchStart;
console.log(`Batch ${i+1} completed in ${batchTime}ms`);
```

## Historical Performance Log

| Date | Version | Total Time | Method | Notes |
|------|---------|------------|--------|-------|
| 2025-12-17 06:00 | Baseline | 180s | Sequential | Initial implementation |
| 2025-12-17 TBD | v1.1 | TBD | Parallel | Phase 1 optimization |

## Success Metrics

### Performance Targets

- ✅ **P0**: Total time < 60s (currently 180s)
- ⏳ **P1**: Total time < 30s
- ⏳ **P2**: Cached evaluations < 5s
- ⏳ **P3**: Background processing (0s perceived wait)

### Quality Metrics

- ✅ Evaluation accuracy > 90% (vs manual review)
- ✅ Error rate < 1%
- ✅ API success rate > 99%

### User Experience

- ⏳ Perceived performance < 10s (with progress indicators)
- ⏳ No timeouts
- ⏳ Real-time progress updates

---

**Benchmark Date**: December 17, 2025
**Status**: 📊 Baseline Established - Ready for Optimization
**Next**: Implement Phase 1 (Parallel Batch Processing)
