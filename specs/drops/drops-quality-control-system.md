# Velocity Fibre DROPS Quality Control System

## Module
**drops-quality-control**

## Overview
This specification outlines a comprehensive DROPS (fiber installation from pole to customer home) quality control system for Velocity Fibre. The system enables agents to review complete home installation submissions against the 14-step Velocity Fibre Home Install Capture Checklist, ensure all required photos and documentation are present, and automatically notify contractors via WhatsApp and browser notifications when installations need to be rectified.

**Critical Business Requirement**: All install jobs must be fully documented with every photo and scan from the 14-step checklist. Any job submitted with missing or incomplete evidence will be marked as unpaid until rectified. These strict quality measures are non-negotiable and form the standard by which Velocity Fibre will gauge installations going forward.

## Type
- **Spec Type**: new-feature
- **Priority**: high
- **Stakeholders**: Development Team, Product Managers, Quality Assurance Agents, Installation Contractors
- **Created**: 2025-09-23
- **Status**: Draft

## Requirements

### Core System
1. **Agent Dashboard**: Review interface for agents to manage DROPS installation submissions against the 14-step checklist
2. **Contractor Portal**: Read-only interface for contractors to view installation status and detailed feedback
3. **WhatsApp Integration**: Automated WhatsApp notifications when installations need rectification
4. **Browser Notifications**: Real-time browser notifications via Pusher for online contractors
5. **Database Schema**: Support for installations, contractors, submissions, reviews, and checklist items
6. **Status Management**: Track installation status through pending → approved/needs-rectification workflow
7. **Real-time Updates**: Live updates using Pusher for dashboard and notifications
8. **Feedback System**: Structured feedback for contractors on missing or incomplete checklist items

### Velocity Fibre 14-Step Checklist Integration
9. **Phase A - Pre-Install Context**: Track Steps 1-5 (Property Frontage, Location on Wall, Outside Cable Span, Home Entry Points)
10. **Phase B - Installation Execution**: Track Steps 6-8 (Fibre Entry to ONT, Patched & Labelled Drop, Work Area Completion)
11. **Phase C - Assets & IDs**: Track Steps 9-10 (ONT Barcode, Mini-UPS Serial Number)
12. **Phase D - Verification**: Track Steps 11-13 (Powermeter Readings, Active Broadband Light)
13. **Phase E - Customer Acceptance**: Track Step 14 (Customer Signature)
14. **Photo/Scan Validation**: Ensure all required photos and scans are present and properly documented
15. **Checklist Completion Tracking**: Track which steps are completed, missing, or need correction
16. **Quality Control Metrics**: Track completion rates, common missing items, and contractor performance

## Velocity Fibre 14-Step Home Install Capture Checklist

### Phase A – Pre-Install Context
- **Step 1**: Property Frontage – Wide shot of house, street number visible
- **Step 2**: Location on Wall (Before Install) – Show intended ONT spot + power outlet
- **Step 3**: Outside Cable Span (Pole → Pigtail screw) – Wide shot showing full span
- **Step 4**: Home Entry Point – Outside – Close-up of pigtail screw/duct entry
- **Step 5**: Home Entry Point – Inside – Inside view of same entry penetration

### Phase B – Installation Execution
- **Step 6**: Fibre Entry to ONT (After Install) – Show slack loop + clips/conduit
- **Step 7**: Patched & Labelled Drop – Label with Drop Number visible
- **Step 8**: Overall Work Area After Completion – ONT, fibre routing & electrical outlet in frame

### Phase C – Assets & IDs
- **Step 9**: ONT Barcode – Scan barcode + photo of label
- **Step 10**: Mini-UPS Serial Number (Gizzu) – Scan/enter serial + photo of label

### Phase D – Verification
- **Step 11**: Powermeter Reading (Drop/Feeder) – Enter dBm + photo of meter screen
- **Step 12**: Powermeter at ONT (Before Activation) – Enter dBm + photo of meter screen. Acceptable: −25 to −10 dBm
- **Step 13**: Active Broadband Light – ONT light ON + Fibertime sticker + Drop No

### Phase E – Customer Acceptance
- **Step 14**: Customer Signature – Collect digital signature + customer name in 1Map

## Acceptance Criteria

1. Agent can create and review DROPS installation submissions
2. System validates all 14 checklist steps are completed with proper photo/scans
3. Agent can mark installations as approved or needs-rectification
4. System automatically sends WhatsApp notifications when status is "needs-rectification"
5. System automatically sends browser notifications to online contractors
6. Contractor can view detailed installation feedback via unique URL
7. Dashboard shows real-time updates when other agents make changes
8. All input validation works properly
9. System handles errors gracefully with user-friendly messages
10. Quality control metrics track completion rates and common issues

## Technical Considerations

### Database Impact
- New tables: installations, contractors, submissions, reviews, checklist_items
- Assume existing users table for Clerk integration
- Support for the 14-step checklist with photo validation
- Foreign key relationships for data integrity
- Indexes for performance on frequently queried fields

### API Changes
- New API routes: /api/drops, /api/reviews, /api/contractors, /api/checklist
- Integration with Twilio API for WhatsApp
- Integration with Pusher for real-time notifications
- Authentication middleware for role-based access

### UI/UX Impact
- New agent dashboard page: /dashboard/drops-reviews
- New contractor page: /contractor/drops/[dropId]
- Comprehensive checklist interface with step-by-step validation
- Modal dialogs for status updates and feedback
- Real-time table updates
- Toast notifications for system events

### Performance
- Database queries optimized with proper indexing
- Real-time updates via Pusher (no polling)
- Optimistic UI updates for better perceived performance
- Efficient photo loading and validation

### Security
- Input validation and sanitization
- Role-based access control (agents vs contractors)
- Secure handling of photo uploads and external URLs
- Environment variable protection for API keys

## Dependencies
- [x] Database schema creation and migration
- [x] Twilio API integration
- [x] Pusher integration
- [x] Agent dashboard components
- [x] Contractor portal components
- [x] API route implementations
- [x] Notification service implementations
- [x] Checklist validation system
- [x] Error handling and validation

## Implementation Notes

### Workflow Integration
1. Contractors complete installations and upload all 14 checklist items to 1Map (external system)
2. Agents manually check 1Map for complete submissions
3. Agents use dashboard to create drop submission and validate checklist compliance
4. If any checklist items are missing, agent selects "needs-rectification" and provides specific feedback
5. On "needs-rectification" status, automatic notifications are sent
6. Contractors receive notifications and can view detailed checklist feedback

### Technology Stack
- Next.js 14+ with App Router
- TypeScript for type safety
- Neon PostgreSQL database
- Twilio for WhatsApp notifications
- Pusher for real-time browser notifications
- Tailwind CSS for styling
- Clerk for authentication (bypassed in development)

### Key Components
- DropsTable: Display drops with filtering and checklist compliance status
- ChecklistReviewModal: Comprehensive 14-step checklist validation interface
- DropsDetail: Contractor view of installation status and checklist feedback
- NotificationService: Handle WhatsApp and Pusher notifications
- ChecklistValidator: Validate completeness of 14-step submissions

### Feedback Presets
Common feedback options for missing checklist items:
- "Missing Step 1: Property frontage photo with street number"
- "Missing Step 9: ONT barcode scan and photo"
- "Missing Step 14: Customer signature in 1Map"
- "Step 12: Powermeter reading outside acceptable range (-25 to -10 dBm)"
- "Step 6: Insufficient fibre slack loop visible"

## Related Files
- Module path: `src/modules/drops-quality-control/`
- Dashboard page: `app/dashboard/drops-reviews/page.tsx`
- Contractor page: `app/contractor/drops/[dropId]/page.tsx`
- API routes: `app/api/drops/`, `app/api/reviews/`
- Components: `src/modules/drops-quality-control/components/`
- Services: `src/modules/drops-quality-control/services/`
- Types: `src/modules/drops-quality-control/types/`

---
**Created**: 2025-09-23 | **Module**: drops-quality-control | **Priority**: high