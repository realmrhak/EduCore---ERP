# Setup Guide — EduCore ERP

## 1. System Requirements
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB server (local or Atlas cloud cluster)

## 2. Backend Installation & Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration file:
   ```bash
   cp .env.example .env
   ```
4. Define your environment values:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/educore
   JWT_SECRET=super_secret_jwt_key
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```
5. Seed database with initial administrative accounts and sample datasets:
   ```bash
   npm run seed
   ```
6. Start development server (via nodemon):
   ```bash
   npm run dev
   ```

## 3. Frontend Installation & Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration file:
   ```bash
   cp .env.example .env
   ```
4. Configure the API url:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
5. Start local Vite development server:
   ```bash
   npm run dev
   ```
   *By default, the application will open on [http://localhost:3000](http://localhost:3000)*
