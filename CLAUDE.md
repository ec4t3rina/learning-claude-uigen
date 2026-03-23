# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Commands

```bash
npm run setup        # Install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npx vitest run path/to/file  # Run a single test file
npm run db:reset     # Hard reset DB migrations
```

Set `ANTHROPIC_API_KEY` in `.env` — the app falls back to a mock provider if missing.

## Architecture

UIGen is a Next.js App Router app where users describe React components in a chat interface and Claude generates code into a virtual file system, which is then live-previewed in a sandboxed iframe.

### Data Flow

```
User message → ChatContext (Vercel AI SDK useChat)
    → POST /api/chat (streamText, maxSteps: 40)
    → Claude with two tools: str_replace_editor + file_manager
    → tool calls handled by FileSystemContext
    → VirtualFileSystem (in-memory)
    → PreviewFrame: Babel JSX transform + esm.sh CDN imports → iframe blob URL
```

### Core Subsystems

**Virtual File System** (`src/lib/file-system.ts`)
All generated code lives in memory — no disk writes. Serializes to/from JSON for database persistence. The AI exclusively modifies files through tool calls, never direct writes.

**AI Tools** (`src/lib/tools/`)
- `str_replace_editor` — view, create, str_replace, insert operations on virtual files
- `file_manager` — rename, delete operations

The generation prompt (`src/lib/prompts/generation.tsx`) instructs Claude to: use `/App.jsx` as the root entry point, style with Tailwind CSS, use `@/` aliases for local imports, and avoid summarizing responses. `@/` maps to `src/` (configured in `tsconfig.json`).

**Chat + File System Contexts** (`src/lib/contexts/`)
`ChatContext` wraps Vercel AI SDK's `useChat` and sends `{ files, projectId }` as body with each request. `FileSystemContext` owns the `VirtualFileSystem` instance and routes incoming tool calls to the appropriate operations.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`)
Transpiles JSX via Babel standalone, builds import maps pointing to esm.sh CDN, strips CSS imports (collecting them separately), and produces a blob URL loaded in an iframe.

**Persistence** (`prisma/schema.prisma`)
SQLite via Prisma. `Project` stores chat messages and virtual FS state as JSON strings. Auth is optional — anonymous users can generate but not save.

### Routing

- `/` — home, redirects authenticated users to their first project
- `/[projectId]` — main workspace (3-panel: chat left 35%, preview+editor right 65%)
- `/api/chat` — streaming AI endpoint

### Key Constraint

The iframe sandbox allows scripts but the virtual FS is in-memory only — no real-time sync across concurrent sessions.

## Code Style

Use comments sparingly. Only comment complex code.
