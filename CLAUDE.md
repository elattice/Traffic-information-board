# CLAUDE.md

This file contains instructions for Claude Code when working on this repository.

Read this file before making changes.

## Project Overview

This project is an open-campus transportation information board.

It displays upcoming bus and train departure times on a large monitor for school open-campus visitors.

The app should be maintainable for yearly open-campus events and may become a permanent display system in the future.

## Tech Stack

Frontend:

- Vite
- React
- TypeScript
- Tailwind CSS

Backend:

- Go
- chi
- SQLite
- modernc.org/sqlite

Runtime:

- Ubuntu PC
- Chromium / Google Chrome kiosk mode

## Architecture

The frontend is built with Vite.

The backend is written in Go and provides REST APIs.

In production, the Go backend should serve the built React app.

Data flow:

```text
CSV
-> SQLite
-> Go API
-> React UI