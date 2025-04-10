# COMP308 Lab 3 - Microservices Application

This application is built using a microservices architecture with separate backend services and frontend applications.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn
- MongoDB (Make sure MongoDB is installed and running)
- Germini API

## Project Structure

- **Server**: Contains the backend microservices
  - `api-gateway`: API Gateway service
  - `auth-microservice`: Authentication service
  - `community-microservice`: Community service

- **Client**: Contains the frontend applications
  - `auth-app`: Authentication frontend
  - `community-app`: Community frontend
  - `shell-app`: Main shell application

## Setup and Running Instructions

### Backend Setup

1. Set up each microservice by creating `.env` files from the templates:
   - Copy `.env.template` files to `.env` in each microservice directory
   - Update with your MongoDB connection details and other required configurations

2. Install dependencies and start each backend service:

   ```bash
   # Auth Microservice
   cd server/auth-microservice
   npm install
   npm run start:auth

   # Community Microservice
   cd server/community-microservice
   npm install
   npm run start:community

   # API Gateway
   cd server/api-gateway
   npm install
   npm run start:gateway
   ```

### Frontend Setup

1. Install dependencies and deploy the client applications:

   ```bash
   # Auth App
   cd client/auth-app
   npm install
   npm run deploy

   # Community App
   cd client/community-app
   npm install
   npm run deploy

   # Shell App (Main Application)
   cd client/shell-app
   npm install
   npm run dev
   ```

## Accessing the Application

Once all services and client applications are running, open your web browser and navigate to:
```
http://localhost:3000
```

## Notes

- Make sure MongoDB is running before starting the backend services
- The backend services must be running before starting the frontend applications
- Each microservice has its own database as specified in their respective `.env` files 