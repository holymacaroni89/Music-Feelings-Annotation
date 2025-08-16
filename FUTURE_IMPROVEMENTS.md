# Future Improvements & Technical Roadmap

This document outlines potential areas for future development to enhance the application's scalability, robustness, and maintainability. While the current architecture is well-suited for its scope, these suggestions provide a path forward as the project's complexity grows.

---

### 1. Centralized State Management

#### Current Situation
The application state is currently managed effectively through a combination of React's `useState` and custom hooks (`useAnnotationSystem`, `useAudioEngine`). State is passed down from the main `App.tsx` component via props. This is a clean and idiomatic React approach that works well for the current feature set.

#### Potential Challenge
As new features are added (e.g., multi-track editing, more complex user settings, real-time collaboration), the state management could become a bottleneck. "Prop-drilling"—passing props through multiple layers of components that don't need them—can become cumbersome and make refactoring difficult. It can also lead to unnecessary re-renders of intermediate components.

#### Proposed Solution: Adopt a Lightweight State Manager (Zustand)
To preempt these issues, introducing a centralized state management library like **Zustand** would be a strategic move.

**Why Zustand?**
*   **Minimal Boilerplate**: It's incredibly simple to set up and use, avoiding the complexity of libraries like Redux.
*   **Hook-Based API**: It feels like a natural extension of React's built-in hooks, making it easy to learn and integrate.
*   **Decouples State from UI**: Components can subscribe directly to the specific pieces of state they need, eliminating prop-drilling entirely.
*   **Performance**: It allows for fine-grained state selection, preventing components from re-rendering if unrelated parts of the state change.

**Implementation Steps:**
1.  **Create a Store**: Define a central store (e.g., in `src/store.ts`) that holds global state like `markers`, `trackInfo`, `activeProfileId`, `profiles`, etc.
2.  **Define Actions**: Actions to modify the state (e.g., `addMarker`, `setActiveProfile`, `updateTrackInfo`) would be defined as functions within the store.
3.  **Refactor Components**: Components like `Header`, `LabelPanel`, and `MarkerList` would be refactored to pull data directly from the store using the `useStore` hook (e.g., `const markers = useStore(state => state.markers);`). This makes them more self-contained and reusable.

---

### 2. Enhanced UI for Error Handling & User Feedback

#### Current Situation
Error conditions and user feedback are often handled using browser `alert()` dialogs (e.g., for API key errors, audio decoding failures) or messages in the console. While functional, this approach has drawbacks.

#### Potential Challenge
*   **Disruptive UX**: `alert()` is a blocking modal that halts all user interaction and feels dated.
*   **Invisibility**: Errors logged to the console are invisible to the average user.
*   **Inconsistency**: There isn't a single, consistent pattern for notifying the user of success, warnings, or errors.

#### Proposed Solution: Implement a Toast Notification System and Error Boundaries

**A. Toast Notifications**
A "toast" is a small, non-blocking notification that appears briefly on the screen. This is ideal for providing contextual feedback without interrupting the user's workflow.

**Implementation Steps:**
1.  **Integrate a Library**: Add a lightweight, modern library like `react-hot-toast` or `Sonner`.
2.  **Create a `ToastProvider`**: Wrap the main `App` component with a global provider.
3.  **Replace `alert()`**: Systematically replace all instances of `alert()` with specific toast notifications:
    *   `toast.error("Genius API key is invalid.")` for API failures.
    *   `toast.success("Profile refined successfully!")` for successful operations.
    *   `toast.info("Import complete. 3 warnings were found.")` for informational messages.

**B. React Error Boundaries**
An Error Boundary is a React component that catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI instead of letting the entire app crash.

**Implementation Steps:**
1.  **Create an `ErrorBoundary` Component**: Build a reusable component using the `react-error-boundary` library or a custom class component.
2.  **Wrap Critical UI Sections**: Wrap key components like `<Workspace />` and `<LabelPanel />` with the `<ErrorBoundary>`. If a component fails to render due to an unexpected error, only that section of the UI will show a "Something went wrong" message, while the rest of the application remains functional.

---

### 3. Comprehensive Automated Testing Strategy

#### Current Situation
The project currently relies on manual testing to ensure quality. This is effective for smaller projects but becomes unreliable and time-consuming as the codebase grows.

#### Potential Challenge
Refactoring core logic (especially in `services` or complex hooks like `useAnnotationSystem`) is risky without an automated test suite to catch regressions immediately. Bugs can easily slip into production.

#### Proposed Solution: Introduce a Multi-Layered Testing Strategy with Vitest

**Why Vitest?**
*   **Modern & Fast**: It's a next-generation test runner that's significantly faster than older tools like Jest.
*   **Jest-Compatible API**: The syntax is familiar, making it easy to write tests.
*   **First-Class TypeScript Support**: No complex configuration is needed to get it working with the project's codebase.

**Implementation Steps:**

**A. Unit Tests**
*   **Goal**: Test individual, isolated functions (especially pure functions).
*   **Targets**:
    *   `services/csvService.ts`: Test `exportToCsv` and `importFromCsv` with various edge cases (e.g., strings containing semicolons/quotes, malformed rows, incorrect headers).
    *   `services/trainingService.ts`: Mock `localStorage` to verify that training data is saved and loaded correctly for different profiles.
    *   Helper functions like `cleanFileName` in `App.tsx`.

**B. Integration / Hook Tests**
*   **Goal**: Test how multiple units work together, focusing on custom hooks.
*   **Tools**: Use `@testing-library/react`'s `renderHook` and `act` utilities.
*   **Targets**:
    *   `hooks/useAnnotationSystem`: Write tests that simulate a user's workflow. For example:
        1.  Render the hook.
        2.  Call `handleMarkerCreationToggle` at time `t1`.
        3.  Assert that `pendingMarkerStart` has the correct value.
        4.  Call it again at `t2` and assert that a new marker has been added to the `markers` array.
    *   `hooks/useAudioEngine`: Mock the Web Audio API to test state transitions (e.g., asserting that `isPlaying` becomes `true` after `togglePlayPause` is called).
