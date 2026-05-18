# Lumos-Lib 

Lumos-Lib is a modern, high-performance **Full-Stack Web Application** designed for book enthusiasts. It allows users to search global databases, manage custom reading lists, and track their reading progress. 

The project features a decoupled architecture with a reactive frontend and a secure backend API.

##  Key Features
- **Global Book Search:** Real-time search powered by integration with the **Google Books API**.
- **Personal Library Management:** Create and curate custom lists (e.g., "To Read", "Reading", "Finished").
- **Social Features:** Add personal reviews, star ratings, and custom reading notes.
- **Advanced Filtering:** Instant frontend sorting and filtering by authors, categories, ratings, and dates.
- **Secure Authentication:** User registration and stateful session management.

##  Tech Stack

### Frontend
- **Framework:** Angular 19 (Reactive Forms, RxJS, HttpClient)
- **Styling:** CSS3 / SCSS (Responsive Web Design)

### Backend
- **Runtime & Framework:** Node.js, Express.js
- **ORM:** Prisma (Object-Relational Mapping)
- **Database:** PostgreSQL / MySQL (managed via Prisma Client)

##  Project Structure & Architecture

```text
Lumos-Lib/
├── backend/          # Node.js + Express API server & Prisma ORM
│   ├── routes/       # API endpoints (books, auth, users)
│   ├── middleware/   # Request interception & Auth guards
│   └── prisma/       # Database schemas & migrations
└── src/              # Angular 19 Client application
    ├── app/          # Core modules, components, and services
    └── assets/       # Static assets and global styles
```
---
This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
