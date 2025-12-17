# DR Photo Verification Manual - Fibertime Aligned

## Purpose
This manual provides exact specifications for a Vision Language Model (VLM) to verify fiber installation photos across 11 QA verification steps, **aligned with Fibertime Build Standards**.

**Key Enhancement**: Housing type detection in Step 1 enables context-aware validation for subsequent steps (especially entry method in Step 3).

---

## Housing Type Classification

### Overview
Fibertime has THREE distinct installation standards based on housing type. Detecting this in Step 1 enables proper validation throughout the workflow.

| Housing Type | Visual Indicators | Entry Method | Power Distance | Key Features |
|--------------|-------------------|--------------|----------------|--------------|
| **Formal** | Brick/plastered walls, structured roof, formal neighborhood | Roof overhang → 12mm duct through wall | 10m max | Marine silicone seal, Polyfilla repairs |
| **Informal** | Corrugated iron/zinc, makeshift structure, informal settlement | Electrical gland entry | 5m max | Clear silicone, saddles 300mm spacing |
| **RDP** | Government housing (standardized design), small brick structure, township layout | Fascia board → trusses → wall duct | 10m max | Guest bedroom preferred, SC-APC duct cut |

### Database Schema for Housing Type

```json
{
  "dr_session": {
    "dr_number": "DR1234567",
    "housing_type": "formal|informal|rdp",
    "housing_type_confidence": 0.92,
    "housing_type_indicators": ["brick walls", "structured roof", "formal neighborhood"],
    "detected_at_step": 1,
    "timestamp": "2024-12-16T10:30:00Z"
  }
}
```

---

## Step 1: House Photo + Housing Type Detection

### What to Look For
- **Primary Subject**: Building exterior (house, apartment, commercial property)
- **Perspective**: Street-level view showing the property
- **Housing Type Classification**: Formal / Informal / RDP

### Housing Type Detection Criteria

#### Formal Housing Indicators
| Indicator | Weight | Description |
|-----------|--------|-------------|
| Brick/plastered walls | HIGH | Permanent construction material |
| Structured roof | MEDIUM | Tiles, IBR sheets on wooden trusses |
| Windows/doors | MEDIUM | Standard residential frames |
| Formal neighborhood | MEDIUM | Structured streets, fencing, landscaping |
| Multiple stories | LOW | Two or more levels |

#### Informal Housing Indicators
| Indicator | Weight | Description |
|-----------|--------|-------------|
| Corrugated iron/zinc | HIGH | Temporary roofing/wall material |
| Makeshift structure | HIGH | Non-permanent construction |
| Informal settlement context | MEDIUM | Dense, unplanned housing area |
| No formal foundation | MEDIUM | Structure on ground/temporary base |
| Mixed building materials | LOW | Wood, metal, plastic combinations |

#### RDP Housing Indicators
| Indicator | Weight | Description |
|-----------|--------|-------------|
| Small brick structure | HIGH | Government housing standard size |
| Standardized design | HIGH | Uniform appearance in neighborhood |
| Township/RDP area context | MEDIUM | Known RDP development area |
| Simple rectangular shape | MEDIUM | Basic government housing design |
| Identical neighboring houses | LOW | Mass-produced housing |

### Required Elements
| Element | Required | Description |
|---------|----------|-------------|
| Building exterior | YES | House, apartment, or commercial building visible |
| Property identifiable | YES | Can determine which property this is |
| Housing type classifiable | YES | Can determine Formal/Informal/RDP |

### Response Format (ENHANCED)

```json
{
  "accepted": true,
  "confidence": 0.92,
  "housing_classification": {
    "type": "formal",
    "confidence": 0.95,
    "indicators_found": [
      "brick_walls",
      "structured_roof",
      "formal_neighborhood"
    ],
    "indicators_missing": []
  },
  "details": "Photo shows formal brick house with tiled roof in established neighborhood",
  "db_update": {
    "housing_type": "formal",
    "housing_type_confidence": 0.95
  }
}
```

### Pass Criteria
- Photo shows a physical building/house exterior
- Building is the main subject of the photo
- Property can be identified
- **Housing type can be classified** (Formal/Informal/RDP)

### Fail Criteria
- Indoor photo
- Close-up of equipment (ONT, UPS, router)
- No building visible
- Photo of sky, ground, or unrelated subject
- **Cannot determine housing type** (too distant, obscured)

### Common Mistakes
- Submitting photo of equipment instead of building
- Photo taken too close (no building context)
- Wrong property photographed
- **Photo doesn't show enough building structure for housing classification**

---

## Step 2: Cable from Pole (Multi-Photo Step)

### Overview
This step captures aerial fiber infrastructure. **Can complete in 1 photo if all elements visible.**

### All Required Elements for Step 2
| Element | ID | Description | Fibertime Requirement |
|---------|-----|-------------|----------------------|
| Utility Pole | `pole` | Wooden/concrete vertical pole | CCA H4 SANS 754 standard |
| Dome Joint | `dome_joint` | Fiber splice enclosure (dome/cylinder box) on pole | Must have slack brackets |
| Cable Run | `cable_run` | THIN fiber drop cable (2-4mm) running from pole to house | Max 50m standard |
| Connection Point | `connection_point` | Hook/bracket/anchor where cable attaches to house | Dead-end wrap on pigtail screw |

### Step 2A: Full Infrastructure Check (First Photo)

#### IMPORTANT: Analyze for ALL 4 Elements
The first photo should be analyzed for **ALL 4 elements**, not just pole and dome joint.

#### Fibertime Specifications
- **Drop Cable Slack**: Max 10m, coiled to ≤300mm diameter loop
- **Pole Slack**: 15.8m-23.0m depending on pole height
- **Drop Max Length**: 50m standard (exceptions documented)

#### Response Must Include
```json
{
  "accepted": true,
  "elements_found": ["pole", "dome_joint", "cable_run", "connection_point"],
  "confidence": 0.88,
  "fibertime_compliance": {
    "drop_cable_visible": true,
    "cable_appears_thin": true,
    "connection_point_type": "pigtail_hook"
  },
  "details": "All aerial infrastructure elements captured"
}
```

#### Pass Criteria
| Scenario | Result | Action |
|----------|--------|--------|
| ALL 4 elements visible | **FULL PASS** | Step 2 complete! Advance to Step 3 |
| 2-3 elements visible | **PARTIAL PASS** | Request Step 2B for missing elements |
| 1 element visible | **PARTIAL PASS** | Request Step 2B for missing elements |
| 0 elements visible | **FAIL** | Retry Step 2A |

### Step 2B: Missing Elements Photo
Capture specific elements not found in Step 2A.

#### Cable Identification Guide
| Feature | Fiber Drop Cable | Power Line |
|---------|------------------|------------|
| Thickness | 2-4mm (very thin) | 10-20mm (thick) |
| Color | Black or gray | Black or silver |
| Pattern | May be twisted/figure-8 | Straight |
| Route | Diagonal from pole to house | Horizontal between poles |

---

## Step 3: Cable Entry Outside (HOUSING-TYPE DEPENDENT)

### Overview
Shows where fiber enters the building from outside. **Entry method MUST match housing type detected in Step 1.**

### Entry Methods by Housing Type

#### Formal Housing Entry Requirements
| Element | Required | Description |
|---------|----------|-------------|
| Roof overhang entry | YES | Drill into highest point of IBR/corrugated zinc curve |
| 12mm duct visible | YES | 12/10mm duct through wall (same length as wall thickness) |
| Pigtail screw | PREFERRED | Secures drop cable to entry point |
| Marine silicone seal | PREFERRED | HV rated black marine silicone and/or Super Laykold tape |
| Drip loop | PREFERRED | Small loop before entry for water drip-off |

**Formal Entry Process (Reference)**:
1. Drill into highest point of IBR/corrugated zinc curve
2. Pigtail screw into pilot hole
3. Seal with black marine silicone
4. Dead-end wrap on drop cable, hook to pigtail
5. Drill 12mm hole through wall
6. Insert 12/10mm duct
7. Small drip loop before entry
8. Seal duct after cable installed

#### Informal Housing Entry Requirements
| Element | Required | Description |
|---------|----------|-------------|
| Electrical gland entry | YES | Proper gland sealing cable entry |
| Zinc/roof entry | YES | 5mm pilot hole through zinc into trusses |
| Pigtail screw | PREFERRED | Secures drop cable |
| 12/10mm duct protection | CONDITIONAL | Required if entry between roof and trusses |
| Clear silicone seal | YES | Weather protection at entry point |

**Informal Entry Process (Reference)**:
1. Drill 5mm pilot hole through zinc into trusses
2. Pigtail screw into pilot hole
3. Seal hole
4. Dead-end wrap on drop cable, hook to pigtail
5. Small drip loop for water protection
6. Electrical gland for drop entry
7. Seal entry point exterior

#### RDP Housing Entry Requirements
| Element | Required | Description |
|---------|----------|-------------|
| Fascia board entry | YES | Drill through fascia board into roof trusses |
| 12mm duct through wall | YES | 12/10mm duct (must be cut end-to-end for SC-APC) |
| Pigtail screw | PREFERRED | Secures drop cable to fascia |
| Truss routing | PREFERRED | Cable routed through roof trusses |

**RDP Entry Process (Reference)**:
1. Drill hole through fascia board into roof trusses
2. Pigtail screw into pilot hole
3. Dead-end wrap on drop cable, hook to pigtail
4. Drill 12mm hole through wall
5. Insert 12/10mm duct (CUT end-to-end - SC-APC won't fit through uncut)
6. Seal duct after installation
7. Fix wall damage with Polyfilla

### Housing Type Entry Validation

```json
{
  "housing_type": "formal",
  "expected_entry_method": "roof_overhang_duct",
  "entry_elements_required": [
    "roof_overhang_entry",
    "12mm_duct",
    "sealed_entry"
  ]
}
```

### Response Format (ENHANCED)

```json
{
  "accepted": true,
  "confidence": 0.85,
  "housing_type_from_step1": "formal",
  "entry_validation": {
    "entry_method_detected": "roof_overhang",
    "matches_housing_type": true,
    "elements_found": ["roof_entry", "duct_visible", "sealed"],
    "elements_missing": [],
    "fibertime_compliant": true
  },
  "details": "Entry point shows proper formal housing installation with roof overhang entry and 12mm duct"
}
```

### Pass Criteria (Housing-Type Aware)
- **Formal**: Roof overhang entry with 12mm duct visible, properly sealed
- **Informal**: Electrical gland entry, sealed with silicone
- **RDP**: Fascia board entry with duct (cut end-to-end for SC-APC)
- Entry point is close-up and clearly visible
- **Entry method matches housing type detected in Step 1**

### Fail Criteria
- Interior photo
- Entry point not visible
- Photo too distant to see entry hardware
- **Entry method does NOT match housing type** (e.g., gland entry on formal house)
- Missing required sealing for housing type

### Warning (Document but Don't Reject)
- Seal quality not visually confirmable
- Drip loop not visible (may be present but not in frame)

---

## Step 4: Cable Entry Inside (Multi-Photo Step)

### Overview
Shows cable entry from INSIDE the building. **ONT NOT YET INSTALLED at this step.**
**Can complete in 1 photo if all elements visible.**

### All Required Elements for Step 4
| Element | ID | Description | Fibertime Requirement |
|---------|-----|-------------|----------------------|
| Cable Entry Inside | `cable_entry_inside` | Where fiber cable comes through wall/ceiling | Must be sealed |
| Cable Routing | `cable_routing` | Clear path from entry point toward ONT location | Natural contours, unintrusive |
| ONT Location | `ont_location` | Wall area where ONT will be mounted | Near power outlet |

### Fibertime Cable Routing Standards
- **Unintrusive**: Follow natural contours (corners, skirting, ceilings)
- **Open wall space**: Last resort only
- **Short cable runs**: Preferred
- **Saddles**: Min 3mm ID, max 300mm spacing (informal/RDP)
- **No exposed cables**: On heat-prone surfaces (informal/RDP)

### Step 4A: Full Interior Check (First Photo)

#### Response Must Include
```json
{
  "accepted": true,
  "elements_found": ["cable_entry_inside", "cable_routing", "ont_location"],
  "confidence": 0.87,
  "fibertime_compliance": {
    "cable_routing_unintrusive": true,
    "following_natural_contours": true,
    "open_wall_exposure": false
  },
  "details": "Cable entry, routing along skirting, and ONT mounting location all captured"
}
```

### Pass Criteria
| Scenario | Result | Action |
|----------|--------|--------|
| ALL 3 elements visible | **FULL PASS** | Step 4 complete! Advance to Step 5 |
| 2 elements visible | **PARTIAL PASS** | Request Step 4B for missing element |
| 1 element visible | **PARTIAL PASS** | Request Step 4B for missing elements |
| 0 elements visible | **FAIL** | Retry Step 4A |

---

## Step 5: Wall for Installation (Multi-Photo Step) - WOODEN BOARD CHECK

### Overview
Pre-installation photo showing where ONT will be mounted. **ONT NOT YET INSTALLED.**
**Can complete in 1 photo if both elements visible.**

### Fibertime Requirements (CRITICAL)

#### Wooden Board Specifications
| Specification | Requirement | Notes |
|---------------|-------------|-------|
| Dimensions | 280mm x 120mm | Varnished, trimmed edges |
| Mounting | Level, 2x self-tapping screws | Or fisher plugs for brick |
| Holes | 4 pre-drilled holes | Standard kit item |
| Position | Allow space for ONT bracket + Gizzu | Center-mounted |

#### ONT Bracket Specifications
| Specification | Requirement | Notes |
|---------------|-------------|-------|
| Position | Middle of wooden board | Centered |
| Mounting | 2x flat head self-tapping screws | Use level before tightening |
| Cable tie hole | 5mm hole in middle of bracket | For Gizzu mounting |

### All Required Elements for Step 5
| Element | ID | Description | Fibertime Requirement |
|---------|-----|-------------|----------------------|
| Wooden Board | `wooden_board` | Varnished 280mm x 120mm board mounted on wall | REQUIRED by Fibertime |
| ONT Bracket | `mounting_bracket` | White plastic bracket on wooden board | REQUIRED |
| Wall Plug | `wall_plug` | Power outlet within reach | REQUIRED (formal: 10m, informal: 5m) |

### Step 5A: Full Mounting Area Check (First Photo)

#### What to Look For (ENHANCED)
- **Wooden board**: 280mm x 120mm varnished board mounted on wall
- **ONT bracket**: White plastic bracket mounted on wooden board
- **Wall plug/outlet**: Power source for equipment

#### Response Must Include
```json
{
  "accepted": true,
  "elements_found": ["wooden_board", "mounting_bracket", "wall_plug"],
  "confidence": 0.91,
  "fibertime_compliance": {
    "wooden_board_visible": true,
    "board_appears_level": true,
    "bracket_centered": true,
    "power_outlet_accessible": true
  },
  "details": "Wooden board with ONT bracket and wall plug all captured"
}
```

### Pass Criteria
| Scenario | Result | Action |
|----------|--------|--------|
| ALL 3 elements visible | **FULL PASS** | Step 5 complete! Advance to Step 6 |
| 2 elements visible | **PARTIAL PASS** | Request Step 5B for missing element |
| 1 element visible | **PARTIAL PASS** | Request Step 5B for missing elements |
| 0 elements visible | **FAIL** | Retry Step 5A |

### Fibertime Compliance Warning
If **wooden board NOT visible** but bracket is directly wall-mounted:
```json
{
  "warning": "FIBERTIME_NON_COMPLIANT",
  "issue": "Wooden board (280mm x 120mm) not visible - direct wall mount detected",
  "recommendation": "Fibertime standard requires varnished wooden board for ONT/UPS mounting"
}
```

---

## Step 6: ONT Back After Install

### What to Look For
- **ONT Device**: Nokia ONT (white rectangular box)
- **Fiber Connection**: Green SC/APC connector
- **Back Panel**: Rear of device showing connection ports

### Fibertime Specifications
| Specification | Requirement | Notes |
|---------------|-------------|-------|
| Fiber routing | Vertical into fiber entry point | Clean vertical run |
| Fiber loop | At least ONCE around integrated fiber management | REQUIRED |
| PON port connection | Green SC/APC connector | Must be secure |
| DC cable | Connected from Gizzu | Neaten with small cable tie |

### ONT Identification Guide
| Feature | ONT (Correct) | UPS/Router (Wrong) |
|---------|---------------|-------------------|
| Labels | PON, LAN, TEL, POWER | BATTERY, AC/DC |
| Branding | Nokia, Huawei, ZTE, Fiberhome | Gizzu, APC |
| Cables | Thin fiber optic cable | Thick power cables |
| Indicators | PON/LAN LEDs | Battery level indicators |

### Required Elements
| Element | Required | Description |
|---------|----------|-------------|
| ONT device | YES | Nokia Optical Network Terminal visible |
| Back/rear panel | YES | Connection side of device shown |
| Fiber cable connected | YES | Green SC/APC fiber optic cable attached |
| Fiber loop visible | PREFERRED | At least 1 loop around fiber management |

### Response Format
```json
{
  "accepted": true,
  "confidence": 0.89,
  "fibertime_compliance": {
    "fiber_loop_visible": true,
    "vertical_fiber_routing": true,
    "sc_apc_connector_visible": true
  },
  "details": "ONT back panel with fiber properly routed and looped"
}
```

---

## Step 7: Power Meter Reading

### What to Look For
- **Power Meter Display**: Digital screen showing dBm reading
- **dBm Value**: Signal strength measurement

### Fibertime Optical Specifications

#### Power Budget (GPON Class C+)
| Direction | Max RX | Min RX | Max Budget |
|-----------|--------|--------|------------|
| OLT TX (1490nm) | -12dBm | -32dBm | 30dB |
| ONT TX (1310nm) | -8dBm | -26dBm | 32dB |

**Safety Margin**: 2dB mandatory

### Acceptable Range
| Reading | Status | Fibertime Compliance |
|---------|--------|---------------------|
| -10 to -20 dBm | Excellent | PASS - Well within budget |
| -20 to -24 dBm | Good | PASS - Within acceptable range |
| -24 dBm | Threshold | PASS (borderline) |
| -25 to -28 dBm | Poor | WARNING - Near budget limit |
| -29 dBm or worse | Critical | FAIL - Exceeds budget |

### Required Elements
| Element | Required | Description |
|---------|----------|-------------|
| Power meter display | YES | Digital readout visible |
| dBm reading | YES | Value clearly readable |
| Reading ≤ -24 dBm | YES | Signal strength acceptable |

---

## Step 8: ONT Barcode/Serial (CRITICAL)

### What to Look For
- **Barcode Label**: Sticker with serial number (usually on BACK or SIDE)
- **Serial Number**: Must start with "ALCL" (Nokia format)

### Serial Number Validation
| Prefix | Device | Action |
|--------|--------|--------|
| ALCL... | Nokia ONT (Correct) | ACCEPT |
| N... | Gizzu/UPS | REJECT |
| GU... | UPS | REJECT |
| GZ... | Gizzu UPS | REJECT |

### Fibertime WiFi Network Format
Serial number relates to WiFi network name:
- Serial: `ALCLB42{XXXX}` (last 4 chars)
- WiFi Network: `ALHN-{XXXX}-5`
- Example: Serial `ALCLB42DFBE` → WiFi `ALHN-DFBE-5`

### Required Elements
| Element | Required | Description |
|---------|----------|-------------|
| Barcode label | YES | Sticker with barcode visible |
| Serial number | YES | ALCL-prefixed serial readable |
| Back/side of device | YES | Not the front panel |

### Response Must Include
```json
{
  "accepted": true,
  "is_barcode_label": true,
  "is_front_panel": false,
  "serial_number": "ALCLB42DFBE",
  "serial_format_valid": true,
  "wifi_network_suffix": "DFBE"
}
```

---

## Step 9: UPS/Gizzu Serial Number + VOLTAGE CHECK (CRITICAL)

### What to Look For
- **UPS Device Label**: Sticker on Gizzu Mini-UPS device
- **Serial Number**: Alphanumeric code on label
- **VOLTAGE SELECTOR**: MUST be on 12V (CRITICAL)

### Fibertime Gizzu Requirements

#### Voltage Selector (CRITICAL)
| Setting | Status | Action |
|---------|--------|--------|
| **12V** | CORRECT | PASS |
| **9V** | WRONG | **FAIL** - Will damage ONT or cause malfunction |

**VLM Must Check**: Voltage selector position if visible in photo

#### Gizzu Mounting
| Requirement | Specification |
|-------------|---------------|
| Position | On top of ONT bracket |
| Mounting | Cable tie through bracket hole |
| Power cable | 10m 3-prong cord, secured to wooden board |
| AC input | Type D plug connection |
| DC output | Connected to ONT DC jack port |

### Required Elements
| Element | Required | Description |
|---------|----------|-------------|
| UPS device | YES | Gizzu Mini-UPS visible |
| Serial label | YES | Sticker with serial number |
| Serial readable | YES | Complete serial number extractable |
| Voltage selector | CRITICAL | Must show 12V setting |

### Response Format (ENHANCED)
```json
{
  "accepted": true,
  "ups_serial": "GUP60WPRO2201617",
  "fibertime_compliance": {
    "voltage_selector_visible": true,
    "voltage_setting": "12V",
    "voltage_correct": true,
    "gizzu_mounted_on_bracket": true,
    "cable_tie_visible": true
  },
  "details": "Gizzu UPS serial captured, voltage correctly set to 12V"
}
```

### Fail Criteria
- Serial blurry or partially visible
- Label not visible
- Cannot extract complete serial
- **Voltage selector shows 9V** (CRITICAL FAILURE)

---

## Step 10: Final Installation

### What to Look For
Complete installation showing all equipment properly mounted per Fibertime standards.

### Fibertime Visual Standards Checklist

#### Equipment Positioning
| Element | Requirement | Check |
|---------|-------------|-------|
| Wooden board | 280mm x 120mm, level, varnished | Visible and level |
| ONT bracket | Centered on wooden board | Properly positioned |
| Gizzu | On top of bracket, cable-tied | Secure mounting |
| ONT | Mounted on bracket | Level, stable |
| Antennas | UPRIGHT position | Both antennas vertical |

#### Cable Management
| Requirement | Pass | Fail |
|-------------|------|------|
| Cables reasonably organized | Yes | Tangled mess |
| Drop slack coiled (≤300mm diameter) | Hidden behind ONT | Exposed, loose |
| DC cable neat | Tied, behind ONT | Hanging loose |
| Power cable route | Following contours | Across open wall |

#### Fibertime Sticker
| Element | Requirement |
|---------|-------------|
| Position | Middle of ONT |
| Alignment | Straight, neat |
| Coverage | No lights covered |

### Required Elements (ALL MANDATORY)
| Element | Required | Description |
|---------|----------|-------------|
| ONT mounted | YES | Nokia ONT on bracket |
| Wooden board | YES | 280mm x 120mm board visible |
| Gizzu/UPS | YES | Black Gizzu on top of bracket |
| Cable management | YES | Cables organized, slack hidden |
| Fibertime sticker | PREFERRED | Centered on ONT |
| Drop label | CHECK | DR number label (verified in Step 11) |

### Response Format
```json
{
  "accepted": true,
  "confidence": 0.93,
  "fibertime_compliance": {
    "wooden_board_visible": true,
    "ont_level": true,
    "antennas_upright": true,
    "gizzu_mounted": true,
    "cable_management_acceptable": true,
    "fibertime_sticker_visible": true,
    "drop_slack_hidden": true
  },
  "details": "Complete installation meets Fibertime visual standards"
}
```

---

## Step 11: Green Lights (CRITICAL)

### What to Look For
- **ONT Front Panel**: LED indicator lights
- **Drop Label**: Yellow sticker with DR number (black on yellow)
- **DR Number Match**: Label matches expected DR

### Light Counting Guide

#### Nokia ONT Indicator Positions (7 total)
1. POWER
2. LINK (or PON)
3. LAN
4. WPS
5. 2.4GHz
6. 5GHz
7. INTERNET

#### Expected Light States (Post-Activation)
| Light | Expected State | Notes |
|-------|----------------|-------|
| POWER | GREEN | Always on |
| PON/LINK | GREEN | Connection to OLT |
| LAN | GREEN (if device connected) | Optional |
| 2.4GHz | GREEN | WiFi active |
| 5GHz | GREEN | WiFi active |
| INTERNET | GREEN | Service active |

**Minimum for PASS**: 4+ lights illuminated

### Drop Label Requirements
| Element | Specification |
|---------|---------------|
| Format | `DRXXXX` (e.g., DR008943) |
| Label type | Brady tape (black on yellow) |
| Position | On Fibertime sticker space |
| Match | Must match 1Map allocated drop number |

### Required Elements
| Element | Required | Pass Threshold |
|---------|----------|----------------|
| Lights ON | YES | 4 or more illuminated |
| DR label visible | DESIRED | Document but don't reject if missing |
| DR number match | YES* | Must match expected DR |
| Antennas upright | YES | Both vertical |

*DR mismatch causes REJECTION (except in test mode)

### Response Must Include
```json
{
  "accepted": true,
  "lights_count": 5,
  "lights_identified": ["POWER", "PON", "2.4GHz", "5GHz", "INTERNET"],
  "dr_number_on_label": "DR008943",
  "dr_mismatch": false,
  "fibertime_compliance": {
    "antennas_upright": true,
    "fibertime_sticker_visible": true,
    "drop_label_format_correct": true,
    "internet_light_on": true
  }
}
```

---

## Response Format Summary

All responses should include housing type context and Fibertime compliance:

```json
{
  "step": 3,
  "accepted": true,
  "confidence": 0.87,
  "session_context": {
    "dr_number": "DR008943",
    "housing_type": "formal",
    "housing_type_confidence": 0.95
  },
  "fibertime_compliance": {
    "compliant": true,
    "warnings": [],
    "critical_issues": []
  },
  "elements_found": ["entry_point", "duct", "seal"],
  "elements_missing": [],
  "details": "Entry method matches formal housing requirements",
  "issues": null
}
```

---

## Fibertime Compliance Summary by Step

| Step | Critical Fibertime Checks | Compliance Field |
|------|---------------------------|------------------|
| 1 | Housing type classification | `housing_classification.type` |
| 2 | Drop cable specs, connection point | `drop_cable_visible`, `connection_point_type` |
| 3 | **Entry method matches housing type** | `entry_validation.matches_housing_type` |
| 4 | Cable routing (unintrusive) | `cable_routing_unintrusive` |
| 5 | **Wooden board 280x120mm** | `wooden_board_visible` |
| 6 | Fiber loop around management | `fiber_loop_visible` |
| 7 | Power reading ≤-24dBm | Within power budget |
| 8 | ALCL serial prefix | `serial_format_valid` |
| 9 | **Voltage selector = 12V** | `voltage_setting`, `voltage_correct` |
| 10 | Visual standards (antennas, sticker) | `antennas_upright`, `fibertime_sticker_visible` |
| 11 | 4+ lights, DR label | `lights_count ≥ 4`, `dr_mismatch` |

---

## Database Updates

### Housing Type Storage (Step 1)
```sql
UPDATE dr_sessions SET
  housing_type = 'formal',
  housing_type_confidence = 0.95,
  housing_indicators = '["brick_walls", "structured_roof", "formal_neighborhood"]',
  updated_at = NOW()
WHERE dr_number = 'DR008943';
```

### Entry Method Validation Query (Step 3)
```sql
SELECT housing_type FROM dr_sessions WHERE dr_number = 'DR008943';
-- Returns: 'formal'
-- Bot then validates entry method matches formal housing requirements
```

### Fibertime Compliance Flag
```sql
ALTER TABLE dr_sessions ADD COLUMN IF NOT EXISTS fibertime_compliant BOOLEAN DEFAULT true;
ALTER TABLE dr_sessions ADD COLUMN IF NOT EXISTS compliance_warnings JSONB DEFAULT '[]';
```

---

## Quick Reference Card

| Step | Must Show | Fibertime Critical Check | Housing-Type Dependent? |
|------|-----------|--------------------------|------------------------|
| 1 | House exterior | **Classify housing type** | N/A - Detection step |
| 2 | Pole + dome + cable + connection | Drop max 50m, dead-end wrap | No |
| 3 | Entry point outside | **Entry method matches housing type** | **YES** |
| 4 | Entry inside + routing | Cable follows natural contours | Partially |
| 5 | Board + bracket + plug | **Wooden board 280x120mm** | No |
| 6 | ONT back | Fiber loop minimum 1x | No |
| 7 | Power meter | Reading ≤ -24 dBm | No |
| 8 | ONT barcode | ALCL prefix serial | No |
| 9 | UPS serial | **12V voltage setting** | No |
| 10 | Full installation | Antennas upright, sticker centered | No |
| 11 | Green lights | 4+ lights + DR match | No |

---

## Common Failure Reasons (Fibertime-Specific)

| Step | Fibertime Failure Reason | Rate |
|------|--------------------------|------|
| 1 | Housing type cannot be classified | 5% |
| 3 | **Entry method doesn't match housing type** | 70% |
| 5 | No wooden board (direct wall mount) | 15% |
| 9 | **Voltage selector on 9V instead of 12V** | 8% |
| 10 | Antennas not upright | 12% |
| 11 | DR number mismatch | 10% |

---

---

## Vision Model API Reference

### DR Verification Model Endpoint

| Property | Value |
|----------|-------|
| **Server** | Velo Server (192.168.1.150) |
| **Tailscale IP** | 100.96.203.105 |
| **Port** | 8100 |
| **API Type** | OpenAI-compatible (vLLM) |
| **Base Model** | MiniCPM-V-2.6 |
| **LoRA Adapter** | dr-verifier |

### API Endpoints

```
# Base URL (Local Network)
http://192.168.1.150:8100

# Base URL (Via Tailscale - VPS Access)
http://100.96.203.105:8100

# Chat Completions (Vision)
POST /v1/chat/completions

# List Models
GET /v1/models
```

### Example API Call

```bash
curl -X POST http://100.96.203.105:8100/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MiniCPM-V-2.6",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Analyze this DR installation photo for Step 1..."},
          {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]
      }
    ],
    "max_tokens": 1024,
    "temperature": 0.1
  }'
```

### VPS Environment Configuration

```bash
# /opt/boss/.env
LOCAL_VLM_ENABLED=true
LOCAL_VLM_URL=http://100.96.203.105:8100
LOCAL_VLM_MODEL=dr-verifier
LOCAL_VLM_TYPE=vllm
```

---

*Document Version: 2.0*
*Last Updated: December 2024*
*Alignment: Fibertime Build Standards v1.1*
*Enhancement: Housing type detection with database integration*
