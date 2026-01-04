# Devzip Command Stack

Developer-centric personal management system using OS/Terminal metaphors.

- Commands represent work items, grouped by Contexts
- Schedule view provides Calendar and Timeline layouts
- Statuses follow terminal semantics (EXECUTING, EXIT_SUCCESS, SIGKILL)

## Structure

- `client`: React 18 (Vite, TypeScript, Tailwind CSS)
- `server`: Spring Boot 3.x (Java 17+, Gradle)

## Quick Start

```bash
# client
cd client
npm install
npm run dev

# server
cd ../server
./gradlew bootRun
```
