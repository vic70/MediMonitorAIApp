# MediMonitor AI Application

A healthcare monitoring application built using a microservices architecture, enabling nurses to monitor patients remotely and patients to track their health status.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn
- MongoDB (Make sure MongoDB is installed and running)
- OpenAI API key for medical condition analysis

## Project Structure

- **Server**: Contains the backend microservices
  - `api-gateway`: API Gateway service that routes requests to appropriate microservices
  - `auth-microservice`: Handles user authentication and authorization
  - `patient-microservice`: Manages patient data, health records, and medical information
  - `nurse-microservice`: Manages nurse assignments, patient monitoring, and alerts

- **Client**: Contains the frontend applications
  - `auth-app`: Authentication frontend for login/signup
  - `patient-app`: Patient portal for tracking health metrics and communication
  - `nurse-app`: Nurse portal for monitoring patients and sending recommendations
  - `shell-app`: Main shell application that coordinates between different apps

## Setup and Running Instructions

### Backend Setup

1. Set up each microservice by creating `.env` files from the templates:
   - Copy `.env.template` files to `.env` in each microservice directory
   - Update with your MongoDB connection details

2. Install dependencies and start each backend service:

   ```bash
   # Auth Microservice
   cd server/auth-microservice
   npm install
   npm run start:auth

   # Patient Microservice
   cd server/patient-microservice
   npm install
   npm run start:patient

   # Nurse Microservice
   cd server/nurse-microservice
   npm install
   npm run start:nurse

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

   # Nurse App
   cd client/nurse-app
   npm install
   npm run deploy

   #Patient APP
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

## Features

- **Authentication System**: Secure login for patients and nurses
- **Patient Portal**: 
  - Track daily health metrics
  - Record symptoms
  - Request appointments
  - Receive motivational tips
  - Emergency alert system
  - View AI analysis of medical conditions

- **Nurse Portal**:
  - Monitor assigned patients
  - View patient health records
  - Send motivational tips
  - Manage appointments
  - Respond to alerts
  - AI-assisted symptom analysis

## Notes

- Make sure MongoDB is running before starting the backend services
- The backend services must be running before starting the frontend applications
- Each microservice uses its own database as specified in their respective `.env` files
- The application uses JWT for authentication between services 