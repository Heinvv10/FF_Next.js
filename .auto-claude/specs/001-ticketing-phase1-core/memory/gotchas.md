# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2025-12-27 07:28]
Dashboard RecentTickets component uses Next.js router which requires proper mocking in tests

_Context: The RecentTickets component references Next.js router/navigation which causes test failures when not properly mocked. Solution: Provide onTicketClick callback in tests or mock 'next/navigation' module in test setup._
