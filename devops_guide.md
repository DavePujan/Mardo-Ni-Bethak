# Quiz Portal – DevOps CI/CD Guide

A practical, real‑world DevOps reference for the Quiz Portal project. This document defines how the team should design, implement, and maintain a secure, reproducible, and environment‑aware CI/CD pipeline.

---

# 📌 Project Context

The Quiz Portal stack includes:

* Frontend: React + Vite
* Backend: Node.js + Express
* Database: Supabase
* Authentication: Google OAuth, GitHub OAuth, JWT
* AI APIs: OpenAI, Groq
* Docs: Swagger (swagger‑autogen)
* Hosting targets: Vercel / Railway / Render / Fly.io / VPS

This creates a complex CI/CD surface and requires careful planning around secrets, environments, and deployments.

---

# 🎯 CI/CD Goals

* Secure handling of secrets
* Reproducible builds
* Environment‑aware configs
* Fast pipelines with caching
* Automatic testing and linting
* Safe and controlled deployments
* Easy debugging and visibility

---

# 🧱 Pipeline Architecture

## Separate Pipelines: Frontend & Backend

Never mix both into one workflow.

```
.github/workflows/
  frontend.yml
  backend.yml
```

Benefits:

* Faster builds
* Easier debugging
* Independent deployments
* Future microservice support

---

# 🔐 Secrets & Environment Variables (CRITICAL)

Services used:

* Supabase
* OpenAI
* Groq
* Google OAuth
* GitHub OAuth
* JWT

## Rules

* NEVER commit `.env` files
* NEVER hardcode API keys
* Rotate keys periodically

## Store in GitHub

```
Settings → Secrets and variables → Actions
```

Example secrets:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
OPENAI_API_KEY
GROQ_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
JWT_SECRET
```

Usage in workflow:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Common mistake:

> Build passes but runtime fails due to missing secrets.

---

# 🧩 Node Version Locking

Use a fixed Node version.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
```

Why:

* Prevent version mismatch bugs
* Consistent builds across machines

---

# ⚡ Dependency Caching

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

Speeds up pipelines significantly.

---

# 🧪 Linting & Testing

## Backend

```
npm run lint
npm test
```

## Frontend

```
npm run build
```

Pipeline should FAIL if:

* Tests fail
* Lint errors occur
* Build fails

This prevents broken production deploys.

---

# 🏗️ Frontend Build & Deployment

For Vite:

```
npm run build
```

Output:

```
/dist
```

Deployment options:

* Vercel (recommended)
* Netlify
* S3 + CloudFront

CI builds → platform handles deploy.

---

# 🚀 Backend Deployment Strategy

## Option A (Recommended)

* Railway
* Render
* Fly.io

Auto deploy on push to main.

## Option B

* Dockerize backend
* Deploy to VPS

---

# 🛡️ Branch Protection

Enable:

* Require PR before merge
* Require status checks

So:

* No direct pushes to main
* CI must pass before merge

---

# 📄 Swagger in CI

Keep docs updated.

```yaml
- run: node swagger.js
```

---

# 💰 AI API Cost Control

* NEVER call real AI APIs in tests
* Mock responses
* Set usage budgets and alerts

---

# 🔎 Security Scans

```yaml
- run: npm audit --production
```

Optional advanced tools:

* Snyk
* Dependabot

---

# 🔑 OAuth & Rate Limits

Ensure callback URLs match:

* Dev
* Staging
* Production

Otherwise login breaks.

---

# 🧩 Example Backend CI

```yaml
name: Backend CI

on:
  push:
    paths:
      - "backend/**"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: cd backend && npm install
      - run: cd backend && npm test
```

---

# 🌱 Branching Strategy

Use feature flow:

```
feature → dev → main
```

Keeps production stable.

---

# 👀 Observability & Logging

Add:

* Structured logs
* Error tracking (Sentry)
* Monitoring dashboards

Logs should make CI failures easy to debug.

---

# 📦 Docker Best Practices (Optional)

* Multi‑stage builds
* Small base images (node:alpine)
* `.dockerignore`
* Health checks

---

# 📊 Recommended CI/CD Maturity Roadmap

## Phase 1

* Basic CI
* Lint + test
* Auto deploy

## Phase 2

* Preview deploys
* Security scans
* Docker builds

## Phase 3

* Canary releases
* Rollback automation
* Full monitoring

---

# ❌ Biggest Mistakes to Avoid

* Committing `.env`
* Using production DB in CI
* Calling AI APIs in tests
* Not locking Node version
* Deploying without checks
* No branch protection

---

# 🧠 DevOps Culture Notes

* CI/CD is not just tools, it’s discipline
* Automate everything repeatable
* Document workflows
* Review pipeline changes via PR

---

# ✅ Final Checklist

* Secrets configured
* Node version locked
* Tests passing
* Lint clean
* Swagger updated
* Security scan clean
* Branch protection enabled

If all green → Safe to deploy 🚀

---

# 🐳 Docker Container Guide (Backend)

This section explains how to containerize the backend for consistency across local, CI, and production.

---

## 📁 Recommended Backend File Structure

```
backend/
  src/
  Dockerfile
  .dockerignore
  package.json
  package-lock.json
  .env.example
```

---

## 🧾 .dockerignore

Create a `.dockerignore` file to keep images small:

```
node_modules
npm-debug.log
.git
.gitignore
.env
coverage
```

---

## 🏗️ Basic Dockerfile (Node + Express)

```
# Use lightweight image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install deps
RUN npm install --production

# Copy source
COPY . .

# Expose port
EXPOSE 5000

# Start app
CMD ["npm","start"]
```

---

## ▶️ Build Docker Image

```
docker build -t quiz-portal-backend .
```

---

## ▶️ Run Container Locally

```
docker run -p 5000:5000 --env-file .env quiz-portal-backend
```

Now your API runs in a container.

---

# ⚙️ Docker Compose (Optional for Local Dev)

If running backend + other services locally:

```
version: "3.9"
services:
  api:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
```

Run:

```
docker compose up
```

---

# ☁️ Deploying Docker to Railway/Render

Both platforms support Docker deploys.

## General Steps

1. Push repo to GitHub
2. Create new service
3. Select **Deploy from Dockerfile**
4. Add environment variables
5. Deploy

---

# ✅ Docker Best Practices Summary

* Keep images small
* Never bake secrets into image
* Use `.env` at runtime
* Use multi-stage builds for production
* Tag images with versions

---

End of document.
