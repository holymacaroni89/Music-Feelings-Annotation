# Music Emotion Annotation Tool

This is a powerful, AI-assisted web application designed for annotating emotional responses to music. It moves beyond a simple manual editor to become an intelligent partner that helps you identify, label, and understand the emotional arc of an audio track.

## Key Features

- **Advanced Audio Visualization**: Displays a spectral color waveform where color represents the sound's brightness (timbre) and height represents its amplitude, making it easy to spot sonic changes.
- **Manual & AI-Assisted Annotation**: Create time-range markers manually with the 'M' key or get a head start by using AI-generated suggestions.
- **AI Emotion Analysis (powered by Google Gemini)**: With the click of a button, the tool sends a summary of the track's audio features (and optional lyrics) to the Gemini AI model to get intelligent suggestions for emotionally significant moments.
- **Lyrics & Metadata Integration (powered by Genius)**: Automatically search for and import song lyrics and metadata from Genius. Providing the AI with lyrical context dramatically improves the accuracy and depth of its emotional analysis.
- **Personalized AI Model (powered by TensorFlow.js)**: The tool learns from your annotations! It uses your edits to train a small, personal machine learning model that refines the base AI's suggestions to better match your unique emotional perception.
- **Multi-Profile System**: Create different user profiles, each with its own personal AI model. The AI's suggestions adapt to the active profile.
- **Comprehensive Annotation Form**: Label markers with a rich set of attributes, including Valence, Arousal, Intensity, GEMS categories, and musical Triggers. Informative tooltips explain each field.
- **Data Portability**: Export your annotations to a CSV file for external analysis or import existing annotations to continue your work.
- **Session Persistence**: Your entire session, including markers, profiles, and training data, is automatically saved to your browser's local storage.

## Getting Started: A Typical Workflow

### One-Time Setup: Genius API Key
To enable the automatic lyrics search, you need a free API key from Genius.
1.  Go to [genius.com/api-clients](https://genius.com/api-clients) and sign in.
2.  Create a "New API Client". You can use `Music Emotion Tool` for the name and `http://localhost` for the URLs.
3.  Click "Generate Access Token" for your new client. Copy this token.
4.  In this application, click the **Settings gear icon** in the top-right corner.
5.  Paste your copied token into the "Genius API Key" field and click "Save Keys". The key will be saved in your browser's storage for future use.

### Annotation Workflow
1.  **Load Audio**: Click the "Load Audio" button to select an `.mp3`, `.wav`, or `.flac` file from your computer.
2.  **Find Lyrics & Metadata**: Click the lyrics icon next to the song title. A search window will appear. Select the correct song from the list to automatically import its lyrics and update the track's title and artist. This provides valuable context for the AI.
3.  **Analyze Emotions**: Click the **"Analyze Emotions"** button. The app will send the audio data and lyrics to the AI. After a few moments, yellow diamonds representing suggested emotional hotspots will appear on the timeline.
4.  **Review & Annotate**:
    - Hover over the yellow diamonds to see the AI's reasoning in a tooltip.
    - Click a diamond to create a new marker, pre-filled with the AI's detailed suggestions.
    - Adjust the values in the form on the right to match your perception.
    - Create your own markers manually by pressing 'M' once to set a start point and again to set the end point.
5.  **Refine Your Profile**: As you create and edit markers, you will accumulate "training points." Once you have enough, click the **"Refine Profile"** button to train your personal AI model. Future analyses under this profile will now be more aligned with your input.
6.  **Export Data**: When you're finished, click the "Export CSV" button to save your work.