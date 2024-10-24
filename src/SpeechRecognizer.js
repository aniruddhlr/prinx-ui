import React, { useState, useEffect } from 'react';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

// Helper function to get audio stream and media recorder
const getAudioStream = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return stream;
    } catch (err) {
        console.error("Error accessing microphone:", err);
        throw err;
    }
};

const SpeechRecognizer = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [socket, setSocket] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [chunks, setChunks] = useState([]);

    const handleStartRecording = async () => {
        try {
            const audioStream = await getAudioStream();

            // Start WebSocket connection
            const ws = new WebSocket('ws://localhost:9090');
            setSocket(ws);

            ws.onopen = () => {
                console.log('WebSocket connection opened');
                setIsRecording(true);

                // Start recording audio when WebSocket is open
                const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/wav' });
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        setChunks((prev) => [...prev, e.data]);
                    }
                };

                recorder.start(1000); // Send data in 1 second chunks
                setMediaRecorder(recorder);
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.segments) {
                    const newText = message.segments.map(segment => segment.text).join(' ');
                    setTranscript((prevTranscript) => `${prevTranscript} ${newText}`);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                setIsRecording(false);
                if (mediaRecorder) {
                    mediaRecorder.stop();
                }
            };

        } catch (error) {
            console.error("Error starting recording:", error);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setMediaRecorder(null);
        }

        if (socket) {
            socket.close();
        }
        setIsRecording(false);
    };

    useEffect(() => {
        // Send audio data to server when recording
        if (chunks.length && socket) {
            chunks.forEach((chunk) => {
                socket.send(chunk);
            });
            setChunks([]);
        }
    }, [chunks, socket]);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Live Transcription</h1>
            <button onClick={handleStartRecording} disabled={isRecording}>Start Recording</button>
            <button onClick={handleStopRecording} disabled={!isRecording}>Stop Recording</button>
            <h2>Transcript:</h2>
            <div style={{ border: '1px solid black', padding: '10px', minHeight: '200px' }}>
                {transcript}
            </div>
        </div>
    );
};

export default SpeechRecognizer;