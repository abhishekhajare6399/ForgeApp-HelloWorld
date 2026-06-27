# Sprint Manager for Jira

A [Forge](https://developer.atlassian.com/platform/forge/) app that provides a Jira **global admin page** with Custom UI (React). It includes lifecycle event handlers, centralized backend logging, and Jira light/dark theme compatibility.

## Features

- **Jira global page** — Custom UI admin page (`Sprint Manager For Jira`)
- **Forge resolver** — Bridge between frontend and backend (`getText`)
- **Lifecycle events** — Install, major-version upgrade, and pre-uninstall handlers
- **Centralized logging** — Structured `ForgeLogger` for Forge-only and remote-correlated logs
- **Jira theme sync** — App automatically follows Jira light/dark/auto theme via CSS variables and `view.theme.enable()`
- **App storage** — `storage:app` scope for Forge KVS

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/#install-the-forge-cli)
- An Atlassian Cloud site with Jira

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for full setup instructions.

## Project structure

```
Sprint-Manager/
├── manifest.yml                 # Forge app manifest (modules, permissions, runtime)
├── package.json                 # Backend dependencies (@forge/resolver, eslint)
├── src/
│   ├── index.js                 # Resolver entry + lifecycle handler exports
│   ├── events/
│   │   ├── install.handler.ts   # avi:forge:installed:app
│   │   ├── upgrade.handler.ts   # avi:forge:upgraded:app
│   │   └── preUninstall.handler.ts
│   └── utils/
│       └── logger.util.ts       # ForgeLogger utility
└── static/                      # Custom UI (React)
    ├── package.json
    ├── build/                   # Production build output (served by Forge)
    └── src/
        ├── index.js             # React entry — enables Jira theme, mounts App
        ├── App.js               # Root React component
        ├── css/
        │   ├── theme.css        # Light/dark CSS custom properties (--sm-color-*)
        │   └── app.css          # Shared UI styles (imports theme.css)
        └── utils/
            └── theme.util.js    # Jira theme sync helpers + React hook
```

## Manifest modules

| Module | Key | Handler | Description |
|--------|-----|---------|-------------|
| `jira:globalPage` | `sprint-manager-admin-page` | `index.handler` | Admin page with Custom UI resource `main` |
| `trigger` | `install-event` | `index.handleInstall` | Fires on `avi:forge:installed:app` |
| `trigger` | `upgrade-event` | `index.handleUpgrade` | Fires on `avi:forge:upgraded:app` |
| `preUninstall` | `pre-uninstall-event` | `index.handlePreUninstall` | Cleanup before uninstall (55s timeout) |
| `function` | `resolver` | `index.handler` | Resolver for frontend `invoke()` calls |

### Runtime & permissions

- **Runtime:** Node.js 24.x, 256 MB, arm64
- **Scopes:** `storage:app`
- **Custom UI resource:** `static/build` (tunnel port `3000` for local dev)

## Backend

### Resolver (`src/index.js`)

Exports lifecycle handlers and defines resolver functions:

| Function | Description |
|----------|-------------|
| `getText` | Sample resolver — returns a greeting string; logs the request payload |

Frontend invokes it via:

```javascript
import { invoke } from '@forge/bridge';
const text = await invoke('getText', { example: 'my-invoke-variable' });
```

### Lifecycle event handlers

| Handler | Event | When it runs |
|---------|-------|--------------|
| `handleInstall` | `avi:forge:installed:app` | Fresh install on a site |
| `handleUpgrade` | `avi:forge:upgraded:app` | In-place **major version** upgrade after admin permission consent |
| `handlePreUninstall` | preUninstall module | User initiates uninstall (55-second cleanup window) |

> **Note:** `forge deploy` creates **minor** versions and auto-updates sites — it does **not** trigger the upgrade event. The upgrade event fires only on major version upgrades (typically permission changes + admin consent). Uninstall + reinstall triggers **install**, not upgrade. See [Forge lifecycle events](https://developer.atlassian.com/platform/forge/events-reference/life-cycle/).

### ForgeLogger (`src/utils/logger.util.ts`)

Structured logging for the Forge runtime:

```
[LOCAL][Module][operation] key=value | message     ← Forge-only (KVS, lifecycle, local logic)
[Module][operation] key=value | message            ← Remote-correlated (backend HTTP calls)
```

| Method | Use when |
|--------|----------|
| `log.info / warn / error / debug` | Operation involves a remote backend call |
| `log.localInfo / localWarn / localError / localDebug` | Operation is entirely within Forge (lifecycle, KVS, permissions) |

Lifecycle handlers use `log.localInfo` under the `LifecycleEvents` module.

## Frontend (Custom UI)

Built with **React 16**, **Create React App**, and **@forge/bridge**.

### Entry point (`static/src/index.js`)

1. Imports `@atlaskit/css-reset` and `./css/app.css`
2. Calls `enableJiraTheme()` (wraps `view.theme.enable()`) **before** React mounts
3. Renders `<App />` into `#root`

### App component (`static/src/App.js`)

- Calls `invoke('getText')` on mount to fetch data from the resolver
- Uses `useJiraTheme()` to display the active Jira color mode
- Applies semantic CSS classes from `app.css`

## Jira theme compatibility

The app follows Jira's light/dark/auto theme automatically.

### How it works

1. `enableJiraTheme()` calls [`view.theme.enable()`](https://developer.atlassian.com/platform/forge/design-tokens-and-theming/) — Forge sets `data-color-mode` on `<html>`
2. `theme.css` defines `--sm-color-*` CSS variables per mode (`light`, `dark`, and a fallback)
3. `app.css` styles all UI elements using those variables — no hard-coded colors
4. `onColorModeChange()` watches `data-color-mode` via `MutationObserver` for live updates

### Theme utility (`static/src/utils/theme.util.js`)

| Export | Description |
|--------|-------------|
| `enableJiraTheme()` | Enables Jira theme sync; call before first render |
| `getColorMode()` | Returns `'light'`, `'dark'`, or `'auto'` |
| `isDarkMode()` | Returns effective dark-mode boolean |
| `onColorModeChange(callback)` | Subscribe to theme changes; returns unsubscribe fn |
| `useJiraTheme()` | React hook — `{ colorMode, isDark }`, re-renders on change |

### CSS tokens (`static/src/css/theme.css`)

Semantic variables prefixed with `--sm-color-`:

| Token | Used for |
|-------|----------|
| `--sm-color-background` | Page background |
| `--sm-color-surface` / `-raised` / `-hover` | Panels and cards |
| `--sm-color-text-primary` / `-secondary` / `-subtle` | Text hierarchy |
| `--sm-color-border` / `-focus` | Borders and focus rings |
| `--sm-color-link` / `-hover` | Links |
| `--sm-color-button-*` | Primary and secondary buttons |
| `--sm-color-success/warning/danger/info` (+ `-bg`) | Status colors |
| `--sm-color-input-*` | Form controls |
| `--sm-color-table-*` | Table headers and row hover |
| `--sm-color-scrollbar-*` | Scrollbar styling |

### CSS component classes (`static/src/css/app.css`)

| Class | Element |
|-------|---------|
| `.sm-app`, `.sm-app__header`, `.sm-app__title`, `.sm-app__subtitle`, `.sm-app__content` | Layout |
| `.sm-text`, `.sm-text--secondary`, `.sm-text--subtle` | Typography |
| `.sm-link` | Links |
| `.sm-card`, `.sm-panel` | Surfaces |
| `.sm-button`, `.sm-button--secondary` | Buttons |
| `.sm-input`, `.sm-select`, `.sm-textarea`, `.sm-label` | Form controls |
| `.sm-badge`, `.sm-badge--success/warning/danger/info` | Status badges |
| `.sm-table` | Data tables |
| `.sm-loading`, `.sm-empty` | Empty and loading states |

## Quick start

### 1. Install dependencies

```bash
# Backend (project root)
npm install

# Frontend (Custom UI)
cd static
npm install
```

### 2. Build the frontend

```bash
cd static
npm run build
```

### 3. Deploy to Forge

```bash
# From project root
forge deploy
```

### 4. Install on a Jira site

```bash
forge install --site <your-site>.atlassian.net --product jira --environment development
```

### Local development with tunnel

Terminal 1 — start the React dev server:

```bash
cd static
npm run dev
```

Terminal 2 — tunnel to Forge:

```bash
forge tunnel
```

Custom UI is served from `static/build` in production and from the tunnel (port `3000`) during local development.

## Useful Forge commands

```bash
forge deploy                              # Deploy code changes (creates minor version)
forge install list                        # Show installations and major versions
forge version list                        # List major versions in an environment
forge install --upgrade --site <site> ... # Major version upgrade (requires consent)
forge logs                                # Stream function logs
```

View structured lifecycle logs in the **Forge Developer Console** → Monitor → Logs. Filter by function name (`install-handler`, `upgrade-handler`, `pre-uninstall-handler`).

## Dependencies

### Backend (`package.json`)

| Package | Purpose |
|---------|---------|
| `@forge/resolver` | Resolver framework for frontend `invoke()` |

### Frontend (`static/package.json`)

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI framework |
| `@forge/bridge` | `invoke`, `view.theme.enable()` |
| `@atlaskit/css-reset` | Atlassian CSS reset aligned with Jira |
| `react-scripts` | Create React App build tooling |

## Support

- [Forge documentation](https://developer.atlassian.com/platform/forge/)
- [Design tokens and theming](https://developer.atlassian.com/platform/forge/design-tokens-and-theming/)
- [Lifecycle events reference](https://developer.atlassian.com/platform/forge/events-reference/life-cycle/)
- [Get help](https://developer.atlassian.com/platform/forge/get-help/)
