# Devzip Command Stack

Developer-centric personal management system using OS/Terminal metaphors.

- Commands represent work items, grouped by Contexts
- Schedule view provides Calendar and Timeline layouts
- Statuses follow terminal semantics (EXECUTING, EXIT_SUCCESS, SIGKILL)

## Screenshots

### Calendar View
Track your commands on a calendar grid with deadline visualization and schedule bars.

![Calendar View](./imgs/calendar-view.png)

### Timeline View
Monitor command execution timelines across week/month/year views with progress tracking.

![Timeline View](./imgs/timeline-view.png)

### Command Creation
Push new commands with a terminal-themed form supporting deadline, context, and type selection.

![Create Command](./imgs/create-command.png)

### Command Details
View and manage command details with status controls and metadata display.

![Command Detail](./imgs/command-detail.png)

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

## Release Notes

- The macOS app must be built and run locally with `build.sh`.
- Installer files for other platforms are available in GitHub Releases.
