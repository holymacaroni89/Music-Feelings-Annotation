# Project Specification: AI-Powered Music Emotion Annotation Tool

This document serves as the complete technical and conceptual blueprint for the Music Emotion Annotation Tool. It captures the project's vision, architecture, and development history to ensure context is preserved for any future development instance.

## 1. Project Vision

The core vision is to evolve a manual audio annotation tool into an intelligent, personalized assistant for music emotion recognition (MER). The system is designed as a dynamic dialogue between the user and the AI. An AI provides a robust baseline analysis, which the user then refines. The system, in turn, learns from these refinements to tailor future analyses to the user's unique emotional perception. The ultimate goal is a tool that accelerates the annotation workflow and provides deeper insights by combining objective AI analysis with subjective human experience.

## 2. Software Architecture

### 2.1. Frontend Stack
-   **Framework**: React (with TypeScript)
-   **Styling**: TailwindCSS
-   **Core Libraries**:
    -   `@google/genai`: For interaction with the Google Gemini AI model.
    -   `@tensorflow/tfjs`: For in-browser training and execution of the personalized machine learning model.
    -   **Web Audio API**: For all audio decoding, playback, and analysis.

### 2.2. Component Structure
The UI is broken down into logical, reusable components to maintain separation of concerns and simplify development.
-   **`App.tsx`**: The main application component, acting as an **Orchestrator**. It holds no UI logic itself but initializes the core logic hooks and passes state and handlers down to the child UI components. It also defines and renders complex modal content.
-   **`components/Header.tsx`**: Renders the entire top bar, including audio loading, profile management, playback controls, and AI action buttons.
-   **`components/Workspace.tsx`**: Renders the main middle section, containing the visualization settings panel, the `Timeline`, and the `MarkerList`.
-   **`components/Footer.tsx`**: Renders the bottom bar with the save indicator and Import/Export buttons.
-   **`components/Timeline.tsx`**: The core interactive component. A canvas-based view responsible for drawing the waveform, markers, playhead, and AI suggestions, and handling all mouse interactions (scrubbing, dragging, resizing).
-   **`components/LabelPanel.tsx`**: The form on the right side for editing the details of a selected marker.
-   **`components/MarkerList.tsx`**: The list of created markers below the timeline.
-   **`components/Modal.tsx`**: A reusable, non-blocking modal dialog used for user input, including profile creation and API key management.

### 2.3. Logic Abstraction (Custom Hooks)
To keep `App.tsx` lean and maintain separation of concerns, all business logic is encapsulated in custom React Hooks.
-   **`hooks/useAudioEngine.ts`**: Manages all aspects of the Web Audio API.
    -   **Responsibilities**: Creating the `AudioContext`, decoding audio files, managing playback state (`isPlaying`, `currentTime`), controlling volume, and generating the spectral waveform data from the `AudioBuffer`.
-   **`hooks/useAnnotationSystem.ts`**: The "brain" of the application.
    -   **Responsibilities**: Managing the core application state related to annotations: `markers`, `profiles`, `songContext`, and `selectedMarkerId`. It also manages all interactions with AI and third-party services, including triggering Gemini analysis, managing the Genius search flow, handling API key state, collecting training data, and initiating the training of the personal TensorFlow.js model.

### 2.4. Data Persistence
-   **`localStorage`** is used for all session data to ensure work is not lost on reload.
    -   **`AUTOSAVE_KEY`**: Stores the main `AppState` (current track, markers, profiles, API keys, and song context data).
    -   **`TRAINING_DATA_PREFIX`**: Stores `TrainingSample[]` arrays, one for each user profile.
    -   **`MODEL_STORAGE_KEY_PREFIX`**: Stores the trained TensorFlow.js model, one for each user profile.

## 3. Feature Breakdown

### 3.1. Third-Party Services Integration
#### Genius API for Rich Song Context
-   **Implementation**: `services/geniusService.ts`
-   **API Key Management**: The user provides their own "Client Access Token" from Genius via a settings modal. The key is persisted in `localStorage`.
-   **Two-Stage UI Workflow**: To maximize usability and data quality, the integration uses a two-stage modal.
    1.  **Search & Select**: The user searches for a song. The app queries the Genius `/search` endpoint and displays a list of results.
    2.  **Review & Confirm**: Upon selecting a result, the app makes multiple parallel requests: it calls the `/songs/:id` endpoint for metadata, scrapes the song's web page for raw lyrics, and critically, calls the `/referents` endpoint to retrieve all line-specific community annotations. It then displays a rich detail view containing all of this information.
-   **Data Compilation**: The service programmatically merges the scraped lyrics with the community annotations, inserting each annotation directly after its corresponding line. Only after user confirmation are all the collected and merged details compiled into a single, formatted `songContext` string, which is then saved and associated with the current audio track.
-   **Technical Note on CORS**: Due to browser security policies, all requests are routed through a public CORS proxy (`corsproxy.io`). This applies to both API calls and HTML page scraping.

### 3.2. AI Suggestion Engine (Two-Tier Model)
This is the core innovation of the application. It combines a powerful general AI with a small, adaptive personal AI.

#### Tier 1: Base MER Model (Gemini)
-   **Implementation**: `services/geminiService.ts`
-   **Process**:
    1.  The audio waveform is summarized into a compact text format.
    2.  This summary, along with the rich `songContext` string fetched from Genius (which now includes line-by-line annotations), is sent to the `gemini-2.5-flash` model.
    3.  A detailed system prompt instructs the AI to act as an MIR/MER expert and to leverage all parts of the provided context (metadata, general annotations, lyrics, and line-specific interpretations) for a deeper analysis.
    4.  A strict `responseSchema` is used to guarantee the output is a valid JSON containing a list of `MerSuggestion` objects.
-   **Output**: A rich set of suggestions including `time`, `valence`, `arousal`, `intensity`, `confidence`, a `reason` for the suggestion, and predictions for `gems`, `trigger`, and `sync_notes`.

#### Tier 2: Personalized Layer (TensorFlow.js)
-   **Implementation**: `services/mlService.ts` and `services/trainingService.ts`.
-   **Process**:
    1.  **Data Collection**: Whenever a user creates or edits a marker, a `TrainingSample` is created. It pairs the Base Model's prediction (input) with the user's final annotation (output). This data is saved per-profile.
    2.  **Training**: When the user clicks "Refine Profile" (and has enough samples), `mlService.ts` creates a small sequential neural network with TensorFlow.js. This model is trained *only* on the user's collected data.
    3.  **Inference**: Once a personal model is trained and loaded for a profile, the analysis workflow changes. The suggestions from the Base Model (Tier 1) are passed through the personal model (Tier 2), which corrects the `valence` and `arousal` values before they are displayed to the user.

## 4. Development History

The application was developed iteratively, building features in logical stages:
1.  **Stage 1: Foundation**: The basic UI for profiles was created, and the AI was initially represented by a *simulated* model.
2.  **Stage 2: Data Collection**: Logic implemented to capture and store user annotations as training data.
3.  **Stage 3: Personalization**: TensorFlow.js integrated to train and apply the personal model, completing the two-tier AI architecture.
4.  **Stage 4: Real AI Integration**: The simulated AI was replaced with a real-time call to the Google Gemini API.
5.  **Stage 5: Lyrics & Metadata Automation**: Integrated the Genius API to allow users to search for and automatically import lyrics and song metadata.
6.  **Stage 6: Advanced Genius Integration & UX Overhaul**: Refactored the Genius feature into a robust, two-stage (search -> review/confirm) workflow. This involved new API calls (`/songs/:id`) and a major UI update to display rich metadata and community annotations, significantly improving the context provided to the Gemini model.
7.  **Stage 7: Line-by-Line Annotation Fetching**: Enhanced the Genius service to query the `/referents` API endpoint, allowing the tool to fetch and merge detailed community annotations directly into the song lyrics for the ultimate level of AI context.
8.  **Follow-up Enhancements**:
    -   Replaced blocking `prompt()` dialogs with a non-blocking `Modal` component.
    -   Fixed numerous UI/UX bugs in the `Timeline` component.
    -   Performed a major refactoring from a monolithic `App.tsx` into a clean, component- and hook-based architecture.

## 5. Future Roadmap
-   **Advanced Visualizations**: Introduce alternative visualization modes, such as a Multi-Band Spectrogram, to provide deeper analytical insights.
-   **Structural Analysis**: Explore using an AI model to automatically segment the song into structural parts (intro, verse, chorus) and display this on a separate timeline track.
-   **Batch Processing**: Allow users to upload multiple audio files and run the base Gemini analysis on all of them in the background.