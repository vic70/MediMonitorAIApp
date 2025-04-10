# Authentication Microservice

This is a simple authentication microservice built with React, Apollo Client, and React Bootstrap. It provides login and signup functionality via GraphQL mutations.

## Features

- User login with username and password
- User registration with username, email, password, and role selection
- Clean, responsive UI using React Bootstrap
- Integration with GraphQL backend

## How it Works

1. When a user logs in successfully, the app dispatches a custom `loginSuccess` event
2. This event is captured by the shell application which then redirects to the community microservice
3. All authentication logic is contained within this microservice

## Dependencies

- React
- Apollo Client for GraphQL
- React Bootstrap for UI components
- GraphQL for API communication

## Setup

Ensure your GraphQL server is running at `http://localhost:4000/graphql` with the required authentication mutations and queries defined in the schema.

## Usage

This microservice is meant to be used as part of a larger microfrontend architecture. It can be imported and used by a shell application to handle all authentication related tasks.
