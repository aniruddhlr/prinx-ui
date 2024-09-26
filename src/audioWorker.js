// audioWorker.js

self.onmessage = (event) => {
    if (event.data.command === 'start') {
        // Create a RecordRTC instance inside the worker
        const { stream, timeSlice } = event.data;

        // Use RecordRTC to start recording
        importScripts('https://cdn.webrtc-experiment.com/RecordRTC.js');

        const recorder = new RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/wav',
            sampleRate: 16000, // Set required sample rate
            numberOfAudioChannels: 1,
            timeSlice: timeSlice,  // Send audio data at defined intervals
            ondataavailable: (audioBlob) => {
                // Send audio data back to main thread
                self.postMessage({ command: 'audioData', audioBlob });
            }
        });

        recorder.startRecording();

        // Handle stop command
        self.onmessage = (e) => {
            if (e.data.command === 'stop') {
                recorder.stopRecording(() => {
                    self.close();  // Terminate worker when recording stops
                });
            }
        };
    }
};
