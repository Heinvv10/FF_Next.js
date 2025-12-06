# FibreFlow - DR Photo AI Review Integration

AI-powered photo evaluation system integrated into the FibreFlow React application. This module enables automated quality assessment of fiber installation photos using GPT-4 Vision.

## 🎯 Project Overview

This project adds a new `/foto-review` module to FibreFlow that:

- Displays DR (Drop Record) installation photos in a gallery interface
- Runs AI-powered evaluations using GPT-4 Vision
- Provides detailed step-by-step quality assessments (12 installation steps)
- Sends automated WhatsApp feedback to field agents
- Tracks evaluation history in PostgreSQL database

## 🏗️ Architecture

### Frontend (React + Next.js 14)
- **Location**: `src/modules/foto-review/`
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React hooks + Context API

### Backend (Python)
- **Location**: `/home/louisdup/VF/agents/foto/foto-evaluator-ach`
- **Engine**: OpenAI GPT-4 Vision API
- **Integration**: Called via Node.js child_process from Next.js API routes

### Database
- **Type**: Neon PostgreSQL (serverless)
- **Table**: `foto_ai_reviews`
- **ORM**: None - direct SQL queries

## 📁 Project Structure

```
FF_React/
├── src/
│   ├── modules/
│   │   └── foto-review/          # NEW MODULE
│   │       ├── components/        # React components
│   │       │   ├── PhotoGallery.tsx
│   │       │   ├── AIEvaluationCard.tsx
│   │       │   ├── EvaluationResults.tsx
│   │       │   └── FeedbackButton.tsx
│   │       ├── services/          # API service layer
│   │       │   └── fotoEvaluationService.ts
│   │       ├── hooks/             # Custom React hooks
│   │       │   ├── useFotoEvaluation.ts
│   │       │   └── usePhotos.ts
│   │       ├── types/             # TypeScript definitions
│   │       │   └── index.ts
│   │       └── README.md          # Module documentation
│   └── pages/
│       └── foto-review/
│           └── index.tsx          # Main page component
├── pages/
│   └── api/
│       └── foto/                  # API endpoints
│           ├── photos.ts          # GET photos list
│           ├── evaluate.ts        # POST evaluate DR
│           ├── evaluation/
│           │   └── [dr_number].ts # GET cached evaluation
│           └── feedback.ts        # POST send feedback
├── feature_list.json              # 200+ test cases
├── init.sh                        # Environment setup script
└── FOTO_REVIEW_README.md          # This file
```

## 🧪 Testing

This project uses a comprehensive test-driven approach with **200+ test cases** defined in `feature_list.json`.

### Test Categories

1. **Functional Tests** (150+)
   - Module structure and organization
   - Component functionality
   - API endpoint behavior
   - Database operations
   - WhatsApp integration
   - Error handling
   - Authentication and security

2. **Style Tests** (50+)
   - Responsive design
   - Accessibility (WCAG AA)
   - Visual consistency
   - Dark mode support
   - Cross-browser compatibility

### Tracking Progress

The `feature_list.json` file tracks all 200+ features:
- Each feature starts with `"passes": false`
- Mark as `"passes": true` only when fully implemented and tested
- **NEVER remove or edit feature descriptions** (prevents missing functionality)

## 🗄️ Database Schema

```sql
CREATE TABLE foto_ai_reviews (
  dr_number VARCHAR PRIMARY KEY,
  overall_status VARCHAR,           -- 'PASS' or 'FAIL'
  average_score DECIMAL,             -- 0.0 - 10.0
  total_steps INTEGER,               -- Always 12
  passed_steps INTEGER,              -- 0 - 12
  step_results JSONB,                -- Detailed step results
  markdown_report TEXT,              -- Formatted report
  feedback_sent BOOLEAN,             -- WhatsApp sent flag
  evaluation_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 📡 API Endpoints

### GET `/api/foto/photos`
Fetch list of DRs with photos (supports filtering by project, date)

### POST `/api/foto/evaluate`
Trigger AI evaluation for a DR

### GET `/api/foto/evaluation/[dr_number]`
Get cached evaluation results

### POST `/api/foto/feedback`
Send WhatsApp feedback to field agent

## 🤖 Python Backend

### Location
```
/home/louisdup/VF/agents/foto/foto-evaluator-ach/
├── evaluate_dr.py          # Main evaluation script
├── foto_verifier.py        # OpenAI API integration
├── foto_prompts.py         # 12-step evaluation prompts
├── foto_config.py          # Configuration
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables
```

## 🚀 Getting Started

See main `README.md` for server setup instructions.

For detailed implementation tasks, see `app_spec.txt`.

---

**Last Updated**: December 2024
**Status**: Initial Setup - Session 1
