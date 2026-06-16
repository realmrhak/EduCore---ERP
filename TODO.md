# EduCore ERP Monorepo Restructure - TODO

- [x] Create `backend/src/routes/index.js` to fix `require('./routes')` in `backend/src/app.js`
- [x] Move frontend root: `app/src` → `frontend/src`
- [ ] Move frontend root: `app/public` (if exists) → `frontend/public` (not found)
- [x] Move frontend root files: `app/index.html`, `app/vite.config.ts`, `app/package.json`, `app/tsconfig*.json`, `app/tailwind.config.js`, `app/postcss.config.js`, `app/eslint.config.js`, `app/components.json` → `frontend/`
- [x] Update backend static serve in `backend/src/app.js` to match new frontend dist path (verified: already correct)
- [x] Update frontend imports/config if paths break after move (verified: working)
- [x] Install deps & run:
  - [x] `npm install` in `backend/`
  - [x] `npm install` in `frontend/`
  - [x] Backend modules load without errors
  - [x] Frontend builds without errors
- [ ] Smoke test:
  - [ ] `POST /api/auth/login` works (requires MongoDB)
  - [ ] Frontend can fetch required APIs (requires MongoDB)

# Bug Fixes Applied

- [x] Fixed `role.middleware.js` — added missing `requireStaff`, `requireAccountant`, `requireLibrarian` exports that `auth.js` barrel was importing
- [x] Fixed `teacher.service.js` — replaced `isActive: true` with `status: 'Active'` (model has no `isActive` field)
- [x] Fixed `notification.service.js` — replaced `isActive: true` with `status: 'Active'`
- [x] Created `FeeStructure` model — was missing, causing `fee.service.js` to crash on `require`
- [x] Created `Book` and `IssueRecord` models — were missing, causing `library.service.js` to crash on `require`
- [x] Added new models to `models/index.js` exports
- [x] Fixed `Result` model — status enum changed from `['published', 'draft']` to `['Pending', 'Approved', 'Rejected']` to match all codebase usage
- [x] Added `approvedBy` field to `Result` model (referenced in `results.routes.js`)
- [x] Fixed `student.controller.js` CSV import — eliminated race condition with async-in-stream-handler pattern
- [x] Fixed `student.controller.js` & `user.controller.js` — `pages` calculation used string `limit` from query
- [x] Fixed `upload.middleware.js` — added CSV MIME types to allow CSV file uploads for student import
- [x] Fixed `Challan` model — added `{ timestamps: true }` for consistency with other models
- [x] Fixed `frontend/package.json` — added `"type": "module"` to eliminate Node.js module type warning
