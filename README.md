# University Portal — EduCore ERP

A full-stack MERN application for managing students, teachers, courses, attendance, exams, fees, library, and notifications.

This repository is structured as a separated monorepo layout containing independent backend and frontend services.

## Directory Structure

```
university-portal/
├── backend/            # Express REST API (thin controllers, fat services)
│   ├── src/
│   │   ├── config/     # Database and environment configs
│   │   ├── controllers/# Express HTTP Controllers
│   │   ├── models/     # Mongoose Schemas & Models
│   │   ├── routes/     # Router definitions mapping to controllers
│   │   ├── middleware/ # Authentication and security middlewares
│   │   ├── services/   # Business logic layer
│   │   └── utils/      # Standardized helper scripts
│   └── server.js       # Backend entry point
│
├── frontend/           # React + Vite Frontend App
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── assets/     # Images & fonts
│   │   ├── components/ # Custom UI components and layouts
│   │   ├── pages/      # Dashboards & resource pages
│   │   ├── services/   # Modular API clients
│   │   ├── hooks/      # Reusable React hooks
│   │   ├── context/    # React contexts (auth, theme)
│   │   └── App.jsx     # Root client router
│   └── vite.config.ts  # Vite configurations
│
└── docs/               # System documentation & PRD
```

## Setup & Running Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas Connection URI)

### Quick Start

1. **Install Backend Dependencies & Configure**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   *Edit `backend/.env` with your database connection URI and JWT secrets.*

2. **Seed Database (Optional)**
   ```bash
   npm run seed
   ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```
   *Backend will run on `http://localhost:5000`*

4. **Install Frontend Dependencies & Run Client**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   *Frontend will run on `http://localhost:3000`*

## Documentation
Check the [docs/](file:///c:/Users/Haroon%20Ameer%20Khan/Downloads/EduCore%20ERP/docs/) folder for complete PRD, API endpoints, setup instructions, and deployment guides.
