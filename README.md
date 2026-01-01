# Secondary UI
- This project allows users to connect to live and historic telemetry/video and perform various competition related functions e.g. (iceberg threat, crab detection)

### Tech stack
- React + TypeScript
- Vite for composing the project [https://vite.dev/]
- MUI for stanard components [https://mui.com/]


Local Development

This project uses Node.js and npm.
The Node version is locked to 20.19.0.

Install and enable it using nvm:
```
nvm install 20.19.0
nvm use 20.19.0
```

Verify the active version:
```
node -v
```
Running the project locally
```
cd ui

# install dependencies
npm install

# start the dev server
npm run dev
```

# Folder Structure
```
ui/
├─ components/
├─ features/
├─ layouts/
├─ pages/
├─ hooks/
├─ context/
├─ theme/
├─ providers/
```
Most folders expose an index.ts to support clean, centralized imports.

You can group similar items in a single folder and rexport them in a single index.ts for things that don't need an entire folder

# Architectural Responsibilities
### components/

Reusable, presentational components only

- No business logic
- No API calls
- No state management beyond local UI state

Must be framework-agnostic where possible
Examples:
- Buttons
- Inputs
- Cards
- Status indicators

### features/

Page-level or domain-specific logic
- Can compose multiple components
- Owns feature-specific hooks, context, and types
- Business rules live here
- No shared logic between features

Shared logic belongs in hooks/, components/, or context/

### pages/

Route-level entry points only
Responsible for:
- Wiring features together
- Handling routing concerns
- No business logic
- No shared logic

### layouts/

Structural UI wrappers (navigation, headers, footers, sidebars):
- No domain logic
- Can accept children
- Can consume context but should not define it

Use layouts when:
- Multiple pages share the same structure
- UI framing is consistent across routes

### hooks/

Custom React hooks only
Used to encapsulate reusable logic

Rules:
- Prefix with use
- No conditional hook calls
- No side effects outside useEffect
- Hooks may call APIs (preferred over components)

### context/

React Context definitions only
- No JSX in this folder (definitions only)

Each context must have:
- Typed value
- Typed provider props
- Custom hook for consumption (e.g. useAuth())

Rules:
- Never consume context directly via useContext
- Always use the exported hook

### providers/

Application-level wiring
Composes and orders context providers
Used at the root of the app

Rules:
- Providers should be thin
- No business logic
- No UI rendering

### theme/

Global theming configuration
- MUI theme, tokens, overrides, typography
- No component logic

# Component Standards
- One component per file
- File name must match the exported component

Props must be:
- Explicitly typed
- Exported
- No inline anonymous functions in JSX
- Prefer named handlers (handleClick, onSubmit, etc.)
```Example:

interface ButtonProps {
  onClick: () => void;
}

export const Button = ({ onClick }: ButtonProps) => {
  const handleClick = () => {
    onClick();
  };

  return <button onClick={handleClick}>Click</button>;
};
```

# Code Quality & Tooling

This project enforces consistency, correctness, and architectural discipline through ESLint, Prettier, Husky, and lint-staged. These tools work together to prevent mixed patterns from entering the codebase.

Linting rules:
- Hooks must follow the Rules of Hooks
- TypeScript recommended rules enabled
- No need to import React in JSX files
- Prevents invalid export patterns

Prettier is responsible for code formatting only.

Pre-commit Hook
Before any commit is created:
Husky runs lint-staged
Commits are blocked if checks fail

This ensures:
- No broken code reaches the repository
- No formatting or lint violations are committed
