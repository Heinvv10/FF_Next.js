# FibreFlow Next.js Application

This is a Next.js application for fiber network project management. It uses React, TypeScript, and Tailwind CSS. The backend is powered by a Neon PostgreSQL database, and it uses Clerk for authentication.

### Project Overview

*   **Project Name:** FibreFlow
*   **Purpose:** A modern Next.js application for fiber network project management.
*   **Technologies:**
    *   **Framework:** Next.js
    *   **Frontend:** React, TypeScript, Tailwind CSS
    *   **Authentication:** Clerk
    *   **Database:** Neon PostgreSQL
    *   **Testing:** Vitest, Playwright
*   **Key Directories:**
    *   `src/`: Contains the majority of the application's source code.
    *   `pages/`: Contains the application's pages.
    *   `lib/`: Contains utility functions, including database connection logic.
    *   `scripts/`: Contains various scripts for database management, testing, and other tasks.
    *   `docs/`: Contains additional documentation.

### Building and Running

The project has a known bug with `npm run dev`. The correct way to run the application is to first build it with `npm run build` and then start it in production mode with `PORT=3005 npm start`.

**Key Commands:**

*   `npm install`: Install dependencies.
*   `npm run build`: Build the application for production.
*   `PORT=3005 npm start`: Start the production server on port 3005.
*   `npm test`: Run tests with Vitest.
*   `npm run test:e2e`: Run end-to-end tests with Playwright.
*   `npm run lint`: Run ESLint.
*   `npm run type-check`: Run TypeScript type checking.
*   `npm run db:migrate`: Run database migrations.
*   `npm run db:seed`: Seed the database.

### Development Conventions

*   **Primary Documentation:** `README.md` and `QUICKSTART.md` are the main sources of information for new developers.
*   **Linting and Formatting:** The project uses ESLint for linting and Prettier for formatting.
*   **Testing:** The project uses Vitest for unit and integration tests and Playwright for end-to-end tests.
*   **Database Management:** The project uses `tsx` to run database management scripts located in the `scripts/` directory.
*   **Branching Strategy:** Not specified in the provided information.
*   **Commit Message Style:** Not specified in the provided information.
*   **CI/CD:** Not specified in the provided information.
*   **Deployment:** The project is deployed to Vercel.

### TODO

*   [ ] Document the branching strategy.
*   [ ] Document the commit message style.
*   [ ] Document the CI/CD process.
