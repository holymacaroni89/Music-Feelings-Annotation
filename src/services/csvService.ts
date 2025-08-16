import { Marker, GEMS, Trigger } from '../types';

const CSV_HEADER = 'track_local_id;title;artist;duration_s;t_start_s;t_end_s;valence;arousal;intensity;confidence;gems;trigger;imagery;sync_notes';

const clamp = (num: number, min: number, max: number): number => Math.max(min, Math.min(num, max));

export const exportToCsv = (markers: Marker[]): string => {
    const header = CSV_HEADER + '\n';
    const rows = markers.map(marker => {
        const triggerString = marker.trigger.join('|');
        const values = [
            marker.trackLocalId,
            marker.title,
            marker.artist,
            marker.duration_s.toFixed(2),
            marker.t_start_s.toFixed(2),
            marker.t_end_s.toFixed(2),
            marker.valence.toFixed(2),
            marker.arousal.toFixed(2),
            marker.intensity,
            marker.confidence.toFixed(2),
            marker.gems,
            triggerString,
            `"${marker.imagery.replace(/"/g, '""')}"`,
            `"${marker.sync_notes.replace(/"/g, '""')}"`
        ];
        return values.join(';');
    });
    return header + rows.join('\n');
};

export const importFromCsv = (csvString: string): { markers: Marker[], warnings: string[] } => {
    const warnings: string[] = [];
    const markers: Marker[] = [];

    const lines = csvString.trim().replace(/\r\n/g, '\n').split('\n');
    const headerLine = lines.shift()?.trim();

    if (headerLine !== CSV_HEADER) {
        warnings.push('CSV header does not match expected format. Import might be incorrect.');
    }
    
    const parseCsvRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                if (inQuotes && row[i+1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ';' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    };


    lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        try {
            const values = parseCsvRow(line.trim());
            const [
                trackLocalId, title, artist, duration_s, t_start_s, t_end_s,
                valence, arousal, intensity, confidence, gems, trigger, imagery, sync_notes
            ] = values;

            if (!trackLocalId || !t_start_s || !t_end_s) {
                warnings.push(`Skipping row ${index + 2}: missing required fields (track_local_id, t_start_s, t_end_s).`);
                return;
            }
            
            const parsedGems = Object.values(GEMS).includes(gems as GEMS) ? (gems as GEMS) : '';
            if (gems && !parsedGems) {
                warnings.push(`Row ${index + 2}: Unrecognized GEMS value "${gems}". Setting to empty.`);
            }

            const parsedTriggers = trigger ? trigger.split('|').filter(t => Object.values(Trigger).includes(t as Trigger)) as Trigger[] : [];
            if (trigger && parsedTriggers.length !== trigger.split('|').filter(t => t !== '' && t !== null).length) {
                 warnings.push(`Row ${index + 2}: Some trigger values in "${trigger}" were unrecognized.`);
            }

            const marker: Marker = {
                id: crypto.randomUUID(),
                trackLocalId: trackLocalId,
                title: title || '',
                artist: artist || '',
                duration_s: parseFloat(duration_s) || 0,
                t_start_s: parseFloat(t_start_s) || 0,
                t_end_s: parseFloat(t_end_s) || 0,
                valence: clamp(parseFloat(valence) || 0, -1, 1),
                arousal: clamp(parseFloat(arousal) || 0, 0, 1),
                intensity: Math.round(clamp(parseInt(intensity, 10) || 0, 0, 100)),
                confidence: clamp(parseFloat(confidence) || 0, 0, 1),
                gems: parsedGems,
                trigger: parsedTriggers,
                imagery: imagery || '',
                sync_notes: sync_notes || '',
            };
            
            if(parseFloat(valence) > 1 || parseFloat(valence) < -1) warnings.push(`Row ${index+2}: Valence clamped to ${marker.valence}.`);
            if(parseFloat(arousal) > 1 || parseFloat(arousal) < 0) warnings.push(`Row ${index+2}: Arousal clamped to ${marker.arousal}.`);
            if(parseInt(intensity, 10) > 100 || parseInt(intensity, 10) < 0) warnings.push(`Row ${index+2}: Intensity clamped to ${marker.intensity}.`);
            if(parseFloat(confidence) > 1 || parseFloat(confidence) < 0) warnings.push(`Row ${index+2}: Confidence clamped to ${marker.confidence}.`);

            markers.push(marker);

        } catch (e) {
            warnings.push(`Error parsing row ${index + 2}: ${e instanceof Error ? e.message : String(e)}`);
        }
    });

    return { markers, warnings };
};
