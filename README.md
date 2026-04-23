# LinkShortner

LinkShortner is a full-stack application designed to shorten long URLs into manageable, trackable links. It provides users with a dashboard to manage their links, use custom slugs, set expiration dates, and view click statistics.

## Table of Contents

- [LinkShortner](#linkshortner)
  - [Table of Contents](#table-of-contents)
  - [Topic of the App](#topic-of-the-app)
  - [Used Technologies](#used-technologies)
    - [Backend (API)](#backend-api)
    - [Frontend](#frontend)
    - [Infrastructure](#infrastructure)
  - [Way of Realization](#way-of-realization)
    - [Project Structure](#project-structure)
    - [Database Schema](#database-schema)
    - [Authentication Flow](#authentication-flow)
    - [Redirection Logic](#redirection-logic)
  - [Architecture](#architecture)
  - [Getting Started](#getting-started)

## Topic of the App

The primary purpose of LinkShortner is to provide a self-hosted solution for URL shortening. Key features include:

- **User Authentication:** Secure registration and login system with JWT.
- **Link Management:** Create, delete, and list shortened links with ease.
- **Custom Slugs:** Users can define their own slugs for more descriptive short links.
- **Expiration Dates:** Optional expiration times for shortened links.
- **Analytics:** Track the number of clicks for each link in real-time.
- **Redirection:** Reliable redirection with in-memory caching for high performance.
- **Dashboard:** Modern UI to manage links, including one-click "Copy to Clipboard" functionality.

## Used Technologies

### Backend (API)

- **Node.js**: Runtime environment.
- **Fastify**: High-performance web framework for Node.js.
- **TypeScript**: Static typing for better maintainability and developer experience.
- **MariaDB 11**: Relational database for storing users and links.
- **@fastify/jwt**: JWT-based authentication.
- **@fastify/mysql**: MySQL/MariaDB integration for Fastify.
- **Bcrypt**: Password hashing for security.
- **In-Memory Cache**: Built-in Map-based caching for frequent redirects to reduce database load.

### Frontend

- **Next.js 16 (App Router)**: React framework for building the user interface.
- **React 19**: Library for building user interfaces.
- **TypeScript**: Ensuring type safety across the frontend.
- **Material UI (MUI) 7**: Component library for a polished and responsive design.
- **Tailwind CSS 4**: Utility-first CSS framework for custom styling.
- **Jose**: Library for handling JWTs and sessions on the client side.

### Infrastructure

- **Docker**: Containerization of all services.
- **Docker Compose**: Orchestration of the API, Frontend, and Database services.

## Way of Realization

### Project Structure

The project is organized as a monorepo with two main services:

- `api/`: Contains the Fastify backend.
- `frontend/`: Contains the Next.js frontend.
- `docker-compose.yml`: Orchestrates the entire stack.
- `init.sql`: Automatically initializes the database schema upon first run.

### Database Schema

The application uses two primary tables:

- **`users`**: Stores user credentials (email and hashed password).
- **`links`**: Stores the original URL, slug (randomly generated or custom), click count, expiration date, and user association.

### Authentication Flow

1. Users register or log in via the frontend.
2. The backend validates credentials and issues a JWT stored in an `httpOnly` cookie.
3. The frontend middleware or API routes verify the token for protected actions.

> [!Note] About account creation
> At this time there is no email confirmation

### Redirection Logic

The application employs a dual-layer redirection strategy for performance and user experience:

1. **Frontend Interstitial:** When a user visits a short link (e.g., `http://localhost:3000/[slug]`), they are greeted with a "Redirecting..." page. A 5-second timer is used to automatically forward the user, providing a smooth transition and a manual fallback link.
2. **Backend Redirection & Caching:**
   - The backend checks an **in-memory cache** for the slug.
   - **Cache Hit:** Immediately redirects to the `original_url` while updating the click count asynchronously.
   - **Cache Miss:** Queries the MariaDB database, validates the link status (active/not expired), populates the cache, and then performs the redirect.
   - This approach significantly reduces database latency for popular links.

## Architecture

```text
[ Browser ] <---> [ Next.js Frontend (Port 3000) ]
                        |
                        v
              [ Fastify API (Port 8080) ]
                        ^
                        |
                        v
              [ MariaDB (Port 3306) ]
```

## Getting Started

To run the application locally using Docker:

1. Clone the repository.
2. Ensure Docker and Docker Compose are installed.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:3000` and the API at `http://localhost:8080`.

> [!Warning]
> On Fedora, backend connections may fail because of SELinux policies (common when using Flatpak versions of Docker). Check if you have `my-dockerentrypoi.pp` and `my-dockerentrypoi.te` to resolve access issues.
