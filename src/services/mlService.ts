import * as tf from '@tensorflow/tfjs';
import { MerSuggestion, TrainingSample } from '../types';

const MODEL_STORAGE_KEY_PREFIX = 'mea_personal_model_';
const getModelPath = (profileId: string) => `localstorage://${MODEL_STORAGE_KEY_PREFIX}${profileId}`;

/**
 * Creates a simple sequential model for personalization.
 * It learns to correct the base model's valence/arousal predictions.
 */
export const createModel = (): tf.Sequential => {
    const model = tf.sequential();
    // Input layer: [valence, arousal]
    model.add(tf.layers.dense({ inputShape: [2], units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    // Output layer: corrected [valence, arousal]
    // tanh activation is ideal as it outputs values in the [-1, 1] range, matching our normalized data.
    model.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
    return model;
};

/**
 * Trains the personalized model with the user's annotation data.
 */
export const trainModel = async (
    model: tf.Sequential,
    trainingData: TrainingSample[],
    onEpochEnd?: (epoch: number, logs: tf.Logs | undefined) => void
): Promise<tf.History> => {
    // Normalize and prepare tensors
    const inputs = trainingData.map(d => [d.input.valence, d.input.arousal]);
    // Normalize user's arousal from [0, 1] to [-1, 1] to match the tanh activation range
    const outputs = trainingData.map(d => [d.output.valence, d.output.arousal * 2 - 1]);

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 2]);
    const outputTensor = tf.tensor2d(outputs, [outputs.length, 2]);

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
    });

    const history = await model.fit(inputTensor, outputTensor, {
        epochs: 50,
        batchSize: 8,
        shuffle: true,
        callbacks: { onEpochEnd },
    });

    // Clean up tensors to free memory
    inputTensor.dispose();
    outputTensor.dispose();

    return history;
};

/**
 * Saves the trained model to the browser's local storage for a specific profile.
 */
export const saveModel = async (model: tf.LayersModel, profileId: string): Promise<void> => {
    try {
        await model.save(getModelPath(profileId));
    } catch (e) {
        console.error("Error saving model", e);
    }
};

/**
 * Loads a previously saved personal model from local storage.
 */
export const loadModel = async (profileId: string): Promise<tf.LayersModel | null> => {
    try {
        const model = await tf.loadLayersModel(getModelPath(profileId));
        console.log(`Personal model for profile ${profileId} loaded successfully.`);
        return model;
    } catch (e) {
        console.log(`No personal model found for profile ${profileId}.`);
        return null;
    }
};

/**
 * Uses the trained personal model to correct/predict suggestions from the base model.
 */
export const predict = (model: tf.LayersModel, suggestions: MerSuggestion[]): MerSuggestion[] => {
    if (suggestions.length === 0) return [];

    tf.tidy(() => {
        const inputs = suggestions.map(s => [s.valence, s.arousal]);
        const inputTensor = tf.tensor2d(inputs, [inputs.length, 2]);

        const predictionTensor = model.predict(inputTensor) as tf.Tensor;
        const predictions = predictionTensor.arraySync() as number[][];

        suggestions = suggestions.map((suggestion, i) => ({
            ...suggestion,
            // Clamp valence just in case model outputs slightly outside range
            valence: Math.max(-1, Math.min(1, predictions[i][0])),
            // De-normalize arousal from [-1, 1] back to [0, 1] and clamp
            arousal: Math.max(0, Math.min(1, (predictions[i][1] + 1) / 2)),
        }));
    });
    
    return suggestions;
};
