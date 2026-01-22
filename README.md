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

To connect to the telemetry broker add the following in an env file at the project root
```
VITE_MQTT_HOST=<WS host name>
VITE_MQTT_PORT=<Web socket port number>
VITE_MQTT_USERNAME=<Find in teams>
VITE_MQTT_PASSWORD=<Find in teams>
```

# Folder Structure
```
ui/
├─  app/
├─  assets/
├─ components/
├─ context/
├─ hooks/
├─ layouts/
├─ pages/
├─ providers/
├─ reducers/
├─ theme/
├─ types/
├─ utils/
```
Most folders expose an index.ts to support clean, centralized imports.

You can group similar items in a single folder and rexport them in a single index.ts for things that don't need an entire folder

# Architectural Responsibilities

### app/

Application entry point and root configuration

Responsibilities:
- Root component setup
- Router configuration
- Global provider composition
- App-level initialization

Rules:
- Keep minimal - delegate to providers/
- No business logic
- No feature code

Examples:
- `App.tsx` - Root component
- `main.tsx` - Vite entry point
- `router.tsx` - Route definitions


### assets/

Static files and media

Responsibilities:
- Images, icons, fonts
- SVG files
- Static JSON data
- Public assets

Rules:
- No executable code
- Organize by type or feature

Examples:
```
assets/
├── images/
│   ├── logo.svg
│   └── background.png
├── fonts/
└── icons/
```

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

### hooks/

Custom React hooks only
Used to encapsulate reusable logic

Rules:
- Prefix with use
- No conditional hook calls
- No side effects outside useEffect
- Hooks may call APIs (preferred over components)

### layouts/

Structural UI wrappers (navigation, headers, footers, sidebars):
- No domain logic
- Can accept children
- Can consume context but should not define it

Use layouts when:
- Multiple pages share the same structure
- UI framing is consistent across routes

### pages/

Route-level entry points only
Responsible for:
- Wiring features together
- Handling routing concerns
- No business logic
- No shared logic

### providers/

React Context providers with business logic

Responsibilities:
- Compose useReducer with context
- Provide memoized values and callbacks
- Handle side effects via useEffect
- Expose typed hooks for consumption

Rules:
- One provider per context
- Export custom hook (e.g., `useAppState()`)
- Keep render logic minimal
- Memoize values and callbacks with useMemo/useCallback

Example:
```typescript
export const AppStateProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const value = useMemo(
    () => ({ state, dispatch }),
    [state]
  );
  
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};
```

### reducers/

State management logic using the reducer pattern

Responsibilities:
- Pure reducer functions
- Action type definitions
- State transformation logic
- Initial state definitions

Rules:
- Must be pure functions
- No side effects
- No async operations
- Thoroughly typed with TypeScript
- One reducer per domain

Example:
```typescript
type AppStateAction =
  | { type: 'TOGGLE_CAMERA'; cameraId: number }
  | { type: 'SET_RECORDING'; cameraId: number; isRecording: boolean };

export const AppStateReducer = (
  state: AppState,
  action: AppStateAction
): AppState => {
  switch (action.type) {
    case 'TOGGLE_CAMERA':
      // Pure state transformation
      return { ...state, /* changes */ };
    default:
      return state;
  }
};
```

### theme/

Global theming configuration
- MUI theme, tokens, overrides, typography
- No component logic

### types/

TypeScript type definitions and interfaces

Responsibilities:
- Shared type definitions
- Constants with types
- API response types
- Domain models

Rules:
- No runtime code (except const enums/constants)

Examples:
```typescript
// types/telemetry.ts
export interface TelemetryField {
  id: string;
  label: string;
  unit: string;
  category: TelemetryCategory;
}

export type TelemetryCategory = 
  | 'attitude' 
  | 'angular' 
  | 'linear';

// types/constants/cameras.ts
export const DEFAULT_CAMERAS: CameraConfig[] = [
  { id: 1, name: 'Front Camera', streamId: 'camera-front' }
];
```

### utils/

Pure utility functions and helpers

Responsibilities:
- Reusable helper functions
- Data transformation
- Formatting logic
- Validation functions

Rules:
- Must be pure functions
- No side effects
- No React hooks
- No state management
- Framework-agnostic
- Well-tested

Examples:
```typescript
// utils/formatters.ts
export const formatTimestamp = (ms: number): string => {
  return new Date(ms).toISOString();
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// utils/validators.ts
export const isValidCameraId = (id: unknown): id is number => {
  return typeof id === 'number' && id > 0;
};
```

When to use utils/:
- Logic is needed in multiple components
- Function has no dependencies on React/state
- Pure computation or transformation

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
