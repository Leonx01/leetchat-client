# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **LeetChat**, a chat application frontend built on the [Fantastic-admin](https://fantastic-admin.github.io) Vue 3 admin framework. It provides real-time messaging with WebSocket/WebRTC support.

## Technology Stack

- **Framework**: Vue 3.4+ with Composition API and `<script setup>`
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **UI Component Library**: Element Plus 2.4+
- **State Management**: Pinia
- **Routing**: Vue Router with file-based routing support (vite-plugin-pages)
- **Styling**: UnoCSS + SCSS
- **Package Manager**: pnpm (required - enforced via preinstall hook)
- **Linting**: ESLint (@antfu/eslint-config) + Stylelint

## Common Commands

```bash
# Development server (runs on port 9000 with host exposed)
pnpm dev

# Production build
pnpm build

# Test environment build
pnpm build:test

# Lint (runs tsc + eslint + stylelint)
pnpm lint

# Lint specific types
pnpm lint:tsc      # TypeScript type checking
pnpm lint:eslint   # ESLint only
pnpm lint:stylelint # Stylelint only

# Serve production build locally
pnpm serve

# Generate new components/views via templates
pnpm new

# Optimize SVG icons
pnpm svgo

# Commit with conventional commits
pnpm commit
```

## Architecture

### Route System

The framework supports three route generation modes configured in `src/settings.ts` via `app.routeBaseOn`:

1. **`frontend`** (default): Routes defined in `src/router/routes.ts` - `asyncRoutes` and `constantRoutes`
2. **`backend`: Routes fetched from API via `routeStore.generateRoutesAtBack()`
3. **`filesystem`**: Routes auto-generated from `src/views/**/*.vue` via vite-plugin-pages

Route navigation guards are in `src/router/index.ts` and handle:
- Authentication checks
- Dynamic route generation on first load
- Keep-alive cache management
- Progress bar (NProgress)

### State Management (Pinia Stores)

Key stores in `src/store/modules/`:

- **`user.ts`**: Authentication state, token management, session persistence
- **`route.ts`**: Dynamic route generation and registration
- **`menu.ts`**: Navigation menu state
- **`settings.ts`**: App configuration from `src/settings.ts`
- **`keepAlive.ts`**: Component cache management
- **`signalChannel.ts`**: WebRTC signaling and WebSocket connection management

### API Layer

- Base axios instance: `src/api/index.ts`
- Response format expected: `{ status: 1, error: '', data: {} }` where `status: 1` indicates success
- API modules: `src/api/modules/*.ts`
- Request interceptors add `Token` header from user store

### WebSocket & Real-time Communication

- WebSocket connection managed in `src/socket/index.ts`
- Signal channel for WebRTC in `src/store/modules/signalChannel.ts`
- Fallback to HTTP polling when WebSocket unavailable

### Styling System

- **UnoCSS**: Atomic CSS with custom shortcuts (`flex-center`, `flex-col-center`)
- **SCSS Variables**: Global variables in `src/assets/styles/resources/`
- **Themes**: Light/dark theme defined in `themes/index.ts`, consumed by UnoCSS config
- **Element Plus**: Dark mode support via `html.dark` class

### Auto-imports

The following are auto-imported (no manual import needed):
- Vue Composition API (`ref`, `computed`, `watch`, etc.)
- Vue Router (`useRouter`, `useRoute`)
- Pinia (`defineStore`)
- Element Plus components (on-demand)
- Icons (@iconify/vue)

### Component Conventions

Vue files follow this block order (enforced by ESLint):
```vue
<route>
<script setup>
<template>
<style>
```

- Route meta defined in `<route>` block for file-based routing
- Components auto-registered from `src/components/`

## Configuration Files

- **`src/settings.ts`**: App customization (overrides defaults from `src/settings.default.ts`)
- **`src/settings.default.ts`**: Framework default settings
- **`.env.development`**: Dev environment variables (API base URL: `http://127.0.0.1:8080/`)
- **`.env.production`**: Production environment variables
- **`uno.config.ts`**: UnoCSS configuration with custom themes
- **`eslint.config.js`**: ESLint with @antfu config, UnoCSS support

## Key Directories

```
src/
  api/           # API modules and axios instance
  assets/        # Static assets, SCSS resources
  components/    # Auto-registered global components
  layouts/       # Layout system components
  menu/          # Menu configuration modules
  mock/          # Mock data (vite-plugin-fake-server)
  router/        # Router configuration and guards
  socket/        # WebSocket implementation
  store/         # Pinia stores
  types/         # TypeScript type definitions
  utils/         # Utility functions and composables
  views/         # Page components (file-system routing)
vite/            # Vite plugin configurations
plop-templates/  # Code generation templates
```

## Development Notes

- **Package Manager**: Only pnpm is allowed (enforced in package.json)
- **Pre-commit**: Automatically runs lint-staged
- **Icons**: SVG icons in `src/assets/icons/`, auto-registered as `<SvgIcon name="..." />`
- **Responsive**: Mobile adaptation available via settings (`layout.enableMobileAdaptation`)
