# Velocity Fibre DROPS Installation Reviews & Quality Control System

## Module
**drops-reviews**

## Overview
This specification outlines a comprehensive DROPS (fiber installation from pole to home) quality control system for Velocity Fibre. The system enables agents to review complete home installation submissions against the 14-step Velocity Fibre Home Install Capture Checklist, ensure all required photos and documentation are present, and automatically notify contractors via WhatsApp and browser notifications when installations need to be rectified.

**Critical Business Requirement**: All install jobs must be fully documented with every photo and scan from the 14-step checklist. Any job submitted with missing or incomplete evidence will be marked as unpaid until rectified. These strict quality measures are non-negotiable and form the standard by which Velocity Fibre will gauge installations going forward.

## Type
- **Spec Type**: new-feature
- **Priority**: high
- **Stakeholders**: Development Team, Product Managers, Field Agents, Contractors
- **Created**: 2025-09-23
- **Status**: Draft

## Requirements

1. **Agent Dashboard**: Review interface for agents to manage pole submissions and status updates
2. **Contractor Portal**: Read-only interface for contractors to view pole status and feedback
3. **WhatsApp Integration**: Automated WhatsApp notifications when poles need to be redone
4. **Browser Notifications**: Real-time browser notifications via Pusher for online contractors
5. **Database Schema**: Support for poles, contractors, submissions, and reviews
6. **Status Management**: Track pole status through pending → approved/needs-redo workflow
7. **Real-time Updates**: Live updates using Pusher for dashboard and notifications
8. **Feedback System**: Structured feedback for contractors on what needs to be fixed

## Acceptance Criteria

1. Agent can view all pole submissions in a dashboard table
2. Agent can update pole status (pending → approved → needs-redo)
3. Agent can provide structured feedback on what needs to be fixed
4. System automatically sends WhatsApp notifications when status is set to "needs-redo"
5. System automatically sends browser notifications to online contractors
6. Contractor can view pole details via unique URL showing status and feedback
7. Dashboard shows real-time updates when other agents make changes
8. All input validation works properly
9. System handles errors gracefully with user-friendly messages

## Technical Considerations

### Database Impact
- New tables: poles, contractors, submissions, reviews
- Assume existing users table for Clerk integration
- ENUM types for status fields
- Foreign key relationships for data integrity
- Indexes for performance on frequently queried fields

### API Changes
- New API routes: /api/poles, /api/reviews, /api/contractors
- Integration with Twilio API for WhatsApp
- Integration with Pusher for real-time notifications
- Authentication middleware for role-based access

### UI/UX Impact
- New agent dashboard page: /dashboard/pole-reviews
- New contractor page: /contractor/poles/[poleId]
- Modal dialogs for status updates and feedback
- Real-time table updates
- Toast notifications for system events

### Performance
- Database queries optimized with proper indexing
- Real-time updates via Pusher (no polling)
- Optimistic UI updates for better perceived performance
- Efficient data loading for dashboard

### Security
- Input validation and sanitization
- Role-based access control (agents vs contractors)
- Secure handling of external URLs
- Environment variable protection for API keys

## Dependencies
- [x] Database schema creation and migration
- [x] Twilio API integration
- [x] Pusher integration
- [x] Agent dashboard components
- [x] Contractor portal components
- [x] API route implementations
- [x] Notification service implementations
- [x] Error handling and validation

## Implementation Notes

### Workflow Integration
1. Contractors upload photos to 1Map (external system, no API integration)
2. Agents manually check 1Map for new submissions
3. Agents use dashboard to find the pole and mark status/feedback
4. If submission needs work, agent selects "needs-redo" and provides feedback
5. On "needs-redo" status, automatic notifications are sent
6. Contractors receive notifications and can view details to understand what to fix

### Technology Stack
- Next.js 14+ with App Router
- TypeScript for type safety
- Neon PostgreSQL database
- Twilio for WhatsApp notifications
- Pusher for real-time browser notifications
- Tailwind CSS for styling
- Clerk for authentication (bypassed in development)

### Key Components
- PoleTable: Display poles with filtering and status update actions
- ReviewModal: Status update and feedback dialog
- PoleDetail: Contractor view of pole status and feedback
- NotificationService: Handle WhatsApp and Pusher notifications

### Feedback Presets
Common feedback options for agents:
- "Missing photos for sides X, Y"
- "Photos are blurry or unclear"
- "Incorrect pole location marked"
- "Missing surrounding area photos"
- "Pole number not visible in photos"

## Related Files
- Module path: `src/modules/pole-reviews/`
- Dashboard page: `app/dashboard/pole-reviews/page.tsx`
- Contractor page: `app/contractor/poles/[poleId]/page.tsx`
- API routes: `app/api/poles/`, `app/api/reviews/`
- Components: `src/modules/pole-reviews/components/`
- Services: `src/modules/pole-reviews/services/`
- Types: `src/modules/pole-reviews/types/`

---
**Created**: 2025-09-23 | **Module**: pole-reviews | **Priority**: high