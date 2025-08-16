import { TrainingSample } from '../types';

const TRAINING_DATA_PREFIX = 'mea_training_data_';

const getProfileKey = (profileId: string) => `${TRAINING_DATA_PREFIX}${profileId}`;

export const loadTrainingDataForProfile = (profileId: string): TrainingSample[] => {
    try {
        const dataJSON = localStorage.getItem(getProfileKey(profileId));
        return dataJSON ? JSON.parse(dataJSON) : [];
    } catch (error) {
        console.error("Failed to load training data for profile", profileId, error);
        return [];
    }
};

export const saveTrainingDataForProfile = (profileId: string, data: TrainingSample[]): void => {
    try {
        localStorage.setItem(getProfileKey(profileId), JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save training data for profile", profileId, error);
    }
};

export const addTrainingSample = (profileId: string, sample: TrainingSample): void => {
    const currentData = loadTrainingDataForProfile(profileId);
    currentData.push(sample);
    saveTrainingDataForProfile(profileId, currentData);
};

export const getTrainingDataCountForProfile = (profileId: string): number => {
    return loadTrainingDataForProfile(profileId).length;
};
