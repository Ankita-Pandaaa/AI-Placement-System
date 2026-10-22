# AI Placement System

Backend for an AI-powered placement preparation platform. Students upload a resume, skills are extracted automatically, and a personalised mock interview is generated and scored.

## Stack

- Node.js, Express, MongoDB (Mongoose)
- JWT authentication
- Python Flask service for skill extraction, question generation and answer scoring

## Setup

Backend:

    cd backend
    npm install
    cp .env.example .env
    node server.js

ML service:

    cd ml-service
    pip3 install -r requirements.txt
    python3 app.py

The backend runs on port 5001 and the ML service on port 6001.

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/students/register | No | Create an account |
| POST | /api/students/login | No | Get a JWT token |
| POST | /api/resumes/upload | Yes | Upload a PDF resume (field name: resume) |
| POST | /api/interviews/start | Yes | Start an interview from a resume |
| POST | /api/interviews/answer | Yes | Submit and score an answer |
| GET | /api/interviews/:sessionId/result | Yes | Get the interview result |

Protected routes need the header `Authorization: Bearer <token>`.
