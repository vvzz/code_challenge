# Vend Park Code Challenge

## Overview

This project demonstrates my take on setting up and designing a continuously evolving application with a
focus on long term maintainability.

The application is deployed at https://vend-park-challenge.web.app/ and should be accessible to any user with a Google
account.

## Runnning The application

1. Install nvm `brew install nvm`
2. Install Firebase `brew install firebase-cli`
3. Login into Firebase `firebase login`

To run local emulator:
`firebase emulators:start`

## Technical overview

The solution is implemented in typescript using Google's Firebase platform. I considered few different approaches and
cloud based offerings and Firebase provides a good balance between functionality and complexity.
The front end is implemented as a single page React web application and backend is an HTTP api cloud function using
Express. If there wasn't a specific requirement to provide an API, I would probably leverage Firebase's ability to use
serverless functions directly from client application as that would simplify some of the interactions.

## UX Design

I provided a basic UI based on bootstrap to demonstrate the interface design patterns that are appropriate in this
solution. Since this application is likely to be used by untrained users(e.g. parking lot attendants) it is designed to
be simple and inviting to use. The UI allows user to filter parking sessions based on their status and also gives
ability to create new session and finalize existing ones. The session view is refreshed every 10 seconds.
The new sessions creation flow is hidden by default as to no overwhelm the UI as I
believe this functionality would be generally done automatically and not require manual intervention regularly. The UI
interactions provide gentle cues such as loading indicators about the state of asynchronous actions. I'm not a graphic
designer, but care has been taken to provide good visual rhythm and color combinations.

## Testing and QA

I believe this application would be served by an end-to-end/smoke test level testing to exercise all the services in
unison. More targeted unit testing could be appropriate for future functionality such as billing and parking rates, but
I would not recommend unit testing for the majority of the codebase as strong typing generally accomplishes many of the
same goals without extra maintenance overhead

## Out of Scope

- ### Authorization
  The application implements basic authentication and JWT verification but does not implement any RBAC or any other
  authorization mechanisms
- ### Monorepo configuration
  I believe that it's imperative to give developers ability to easily restructure and decompose code across the whole
  codebase. The _lib_ folder is designed to demonstrate a potential shareable codebase that could be exposed one of the
  shared modules.
- ### Devops and immutable infrastructure
  Firebase provides some built in tools for quickly creating and deploying infrastucture which is sufficient for this
  project, but in a production environment I would like to see the infrastructure fully defined in code.
- ### Logging and instrumentation
  The code leaves provisions for easily adding centralized logging/tracing, but it is not implemented in the scope of
  this work
- ### Pagination
  Given a potentially large amount of sessions accumulating over time for a given parking facility, I would recommend
  an approach combining easy filtering by important session parameters(e.g. plate, car make, color, session duration,
  date) and pagination logic. Just pagination alone would not lead to good UX
