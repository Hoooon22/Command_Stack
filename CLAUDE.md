# Project: Devzip - Command Stack Module

## 1. Project Overview

"Command Stack" is a developer-centric personal management system embedded in the "Devzip" platform.
It reimagines productivity using OS/Terminal metaphors.

- **Philosophy:** Treat life tasks as "Processes" and "Commands".
- **Visual Style:** Dark Terminal / IDE Theme (Monospace fonts, high contrast, console logs).

## 2. Tech Stack & Environment

- **Monorepo Structure:**
  - `/server`: Spring Boot 3.x (Java 17+, Gradle-Groovy)
  - `/client`: React 18 (Vite, TypeScript, Tailwind CSS)
- **Database:** H2 (Local/Dev), MySQL (Prod)
- **State Management:** React Query (Server State), Zustand (Client State)
- **UI Libraries:** Tailwind CSS, Lucide React (Icons), date-fns

## 3. Domain Terminology (Strict Adherence)

DO NOT use standard "Todo" terminology. Use the following mapping:

- **Task** -> `Command`
- **Project/Category** -> `Context`
- **Routine/Habit** -> `Daemon`
- **Backlog** -> `Heap`
- **Completed** -> `EXIT_SUCCESS`
- **Cancelled** -> `SIGKILL`
- **In Progress** -> `EXECUTING`
- **Add Task** -> `Push`
- **Complete Task** -> `Return 0` or `Pop`

## 4. Coding Conventions

### Backend (Spring Boot)

- **Package:** `com.devzip.commandstack`
- **Architecture:** Controller -> Service -> Repository -> Domain (Entity)
- **Response Format:** Standard JSON envelope (e.g., `{ "status": 200, "data": ... }`)
- **Validation:** Use `jakarta.validation` constraints on DTOs.
- **Lombok:** Use `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@AllArgsConstructor`, `@Builder`.

### Frontend (React)

- **Style:** Use Tailwind CSS utility classes. Avoid CSS files unless for global resets.
- **Components:** Functional components with TypeScript interfaces for props.
- **Path:** Use absolute imports (`@/components/...`) if configured, or clean relative paths.
- **Theme:**
  - Background: `#1e1e1e` (VSCode Dark) or `#000000` (Pure Terminal).
  - Accent: `#00ff00` (Green terminal text) or `#50fa7b` (Dracula Green).
  - Font: Use a Monospace font stack (Fira Code, JetBrains Mono, or Courier New).

## 5. Development Workflow Rules

1. **Path Awareness:** Always be aware of the current directory.
   - Run Gradle commands in `/server`.
   - Run npm commands in `/client`.
2. **Step-by-Step:** When creating new features, define the Backend Entity/API first, then the Frontend UI.
3. **No Lorem Ipsum:** Use developer-themed placeholder text (e.g., "Deploy to prod", "Refactor Auth module").

## 6. Architecture Goals

- **Scaffold:** Create a robust structure that separates `Product` (Production-ready) and `Experimental` (Learning) features, although "Command Stack" is treated as a Product.
- **Performance:** Minimizing re-renders in the React frontend is a priority.

## 7. Google Calendar Sync

- Every Command should be synced with Google Calendar.

## 8. Github and Program version sync

- Every Command should be synced with Github.
- Every Program version should be synced with Github.
