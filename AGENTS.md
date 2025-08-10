# Repository Guidelines

## Project Structure & Module Organization

- Source: `src/` (features in `src/features/{analysis,projects,STAMP}`, shared UI in `src/components/{ui,magicui,shared}`, state in `src/context`, utilities in `src/utils`).
- Entry: `index.html` + `src/index.tsx`, app shell `src/App.tsx` (React Router + context providers).
- Styling: Tailwind via `src/styles/main.css`.
- Assets: `src/assets/` (bundled) and `public/` (served as-is).
- Config: `config/` (Vite, TypeScript, ESLint, Prettier). Docs in `docs/`.

## Build, Test, and Development Commands

- `npm run dev`: Start Vite dev server.
- `npm run build`: Type-check then build to `dist/`.
- `npm run preview`: Serve the production build locally.
- `npm run quality`: Type-check, lint, and Prettier check.
- `npm run lint` / `lint:fix`: ESLint check / autofix.
- `npm run format` / `format:check`: Prettier write / verify.

## Coding Style & Naming Conventions

- Language: TypeScript (strict). React 19 with hooks; JSX in `.tsx`.
- Formatting: Prettier (2-space indent, single quotes, semicolons, width 100).
- Linting: ESLint with React, hooks, import order, a11y; prefer `const`, no `var`.
- Imports: Use path aliases (e.g., `@/components/Button`); group and alphabetize.
- Naming: `PascalCase` for components, `camelCase` for functions/vars, `kebab-case` for files.

## Testing Guidelines

- Current: No unit test framework configured. CI quality gate is `npm run quality`.
- If adding tests: prefer Vitest + React Testing Library; co-locate as `*.test.ts(x)` near source and run via a `test` script.

## Commit & Pull Request Guidelines

- History is inconsistent; follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Branches: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- PRs: include purpose, linked issues (`Closes #123`), screenshots/GIFs for UI, and notes on breaking changes. Ensure `npm run quality` and a local `npm run build` pass.

## Security & Configuration Tips

- Do not commit secrets. Use `public/` for static assets; imports from `src/assets/` are bundled.
- Routing uses `BrowserRouter` with `basename` from Vite `BASE_URL`; production base is `/STAMPWebTool/` (see `config/vite.config.ts`).
