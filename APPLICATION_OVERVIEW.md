# ATS System – Application Overview

This document describes what the **ATS (Applicant Tracking System)** frontend application does, its main features, user roles, and technical stack.

---

## What This App Does

The **ATS System** is a **recruitment and hiring management** web application. It helps organizations:

- **Publish job descriptions** and manage open positions
- **Collect and evaluate resumes** (single upload, bulk upload, or via shareable candidate links)
- **Schedule and manage interviews** (assign interviewers, manage availability, book slots)
- **Track candidate progress** through evaluations, interviewer feedback, and HR decisions
- **Run walk-in drives** and **analytics** on recruitment metrics

The app supports **three roles**: **Admin**, **HR**, and **Interviewer**, each with different dashboards and permissions. Candidates can apply via **token-based public links** (no login required) and book interview slots directly.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue 3 (Composition API) |
| Router | Vue Router 4 |
| HTTP | Axios |
| UI | Bootstrap 5 |
| Charts | Chart.js |
| Dates | Moment.js |
| Build | Vite 5 |

---

## User Roles & Access

| Role | Description | Access |
|------|-------------|--------|
| **Admin** | Full system control | All features + user management, settings (SMTP, Zoom, Groq, KPI), create users |
| **HR** | Recruitment operations | Job descriptions, resumes, uploads, candidates, walk-in drives, analytics, HR decisions; no Settings / Create User |
| **Interviewer** | Conduct interviews | Dashboard, assigned candidates, submit feedback; no All Resumes, Walk In, Analytics, Create User, Settings |

- **Auth:** Login required for all internal routes; token stored in localStorage and sent as Bearer token.
- **Public routes:** Candidate application page (`/candidate/:token`) and interview booking success page do not require login.

---

## Main Features (by Area)

### 1. Authentication & Users

- **Login** (`/login`): Email/password sign-in; redirect after login depends on role.
- **Register / Create User** (`/register`, Admin only): Create users with email, password, full name, and role (HR / Interviewer / Admin); list and edit existing users.

### 2. Dashboard

- **Dashboard** (`/`): Role-based home.
  - **HR / Admin:** Today’s interviews, new candidates, open positions, decision-pending list, quick links to jobs and decision-pending.
  - **Interviewer:** My availability/slots, generate slots, my assignments, submit feedback.

### 3. Job Descriptions

- **Job list** (`/job-descriptions`): Search and list jobs; create, edit, delete job descriptions (HR/Admin). Shows parse and application status; links to job detail.
- **Job detail** (`/job-descriptions/:id`): Single job view with:
  - Resume upload
  - Evaluations (accepted / pending / rejected)
  - Generate and copy **candidate link** (public application URL)
  - Assign interviewers and slots
  - Interviewer feedback and **HR decision** (e.g. selected / rejected / on hold)

### 4. Resumes & Evaluations

- **Bulk upload** (`/upload`, HR/Admin): Select a job and upload one or many resumes.
- **All Resumes** (`/resumes`): Resume database with search; resume cards (name, email, phone, skills, experience); download; link to resume detail. Hidden for Interviewer in nav.
- **Resume detail** (`/job-descriptions/:jobId/resumes/:evaluationId`): Single evaluation with match scores (skills, experience, education), analysis, download resume, set status (HR).
- **Candidates for a job** (`/candidates/:jobId`): List of candidates for one job with status filter, sort, assign interviewer/slot, HR decision.

### 5. Candidate (Public) Flow

- **Candidate link** (`/candidate/:token`): Public page (no login). Candidate can:
  - View job summary
  - Upload resume
  - Answer questions
  - Book an interview slot or see rejection
- **Interview booking success** (`/interview-booking-success`): Confirmation page after slot booking; shows job and interview time from query params.

### 6. Interviewer

- **My candidate list** (`/interviewer-candidate-list`): Assignments in “decision pending” vs “decision done”; submit feedback (ratings, status) for assigned candidates.

### 7. HR Decisions

- **All decision pending** (`/all-interview-decision-pending`): Paginated list of evaluations awaiting HR decision; open “HR Decision” modal with interviewer feedback and set final decision.

### 8. Walk-In Drives

- **Walk-in list** (`/walkin`): List, search, create, edit, delete walk-in drives (HR/Admin).
- **Walk-in detail** (`/JobDetails/:id/walkin/:walkinId`): Drive info, upload resumes, evaluations, assign interviewers, HR decision (same flow as job detail but for walk-in).

### 9. Talygen Files

- **Talygen files** (`/talygen-files`): Upload files to Talygen, list with pagination, download. HR/Admin can upload.

### 10. Analytics

- **Analytics** (`/analytics`, HR/Admin only): Recruitment analytics with date range filters, charts, and export.

### 11. Settings (Admin Only)

- **Config** (`/config`): Tabs for **SMTP**, **Zoom**, **Groq**, and **KPI** (recruitment metrics); get/update configuration via API.

---

## Navigation Summary

| Link | Shown to |
|------|----------|
| Dashboard | All authenticated |
| Job Descriptions | All authenticated |
| All Resumes | HR, Admin (hidden for Interviewer) |
| Walk In Interview | HR, Admin |
| Analytics | HR, Admin |
| Create User | Admin only |
| Settings | Admin only |

---

## API & Configuration

- **Base URL:** Configured in `src/config/api.js` (e.g. backend base URL); can be overridden via environment.
- **Dev proxies:** Vite proxies `/api` to backend and `/talygen` to Talygen file host.
- **Auth:** Bearer token in `Authorization` header and in localStorage (`auth_token`, `refresh_token`); managed via `useAuth` and Axios.

Main API areas: **auth** (login, register, users, me), **job-descriptions**, **resumes**, **upload** (single, bulk, Talygen), **evaluations** (by job, status, timeline, interviewer feedback, HR decision), **candidate-links** (token, submit, book-slot, generate), **interviews** (slots, assign, my-assignments, etc.), **walkIn**, **config** (smtp, zoom, groq, kpi), **analytics**.

---

## Key Composables & Utilities

- **useAuth:** Login, logout, register, `auth/me`, token handling; exposes `user`, `isAuthenticated`, `isAdmin`, `hasWriteAccess`, `hasRole`.
- **useLoader:** Global fullscreen loader with message/submessage.
- **useTalygenFiles:** Talygen upload, list, download, pagination.
- **datetimeUtils:** Date/time formatting (UTC-oriented) used across views.

---

## Summary

The **ATS System** is a **Vue 3 SPA** for end-to-end recruitment: job posting, resume collection (upload + public links), resume evaluation, interviewer assignment and feedback, HR decisions, walk-in drives, and analytics. Access is controlled by **Admin**, **HR**, and **Interviewer** roles, with candidates using **token-based public links** to apply and book interview slots.
