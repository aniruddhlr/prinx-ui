import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';
import './SpeechRecognizer.css'; // Import CSS

function SpeechRecognizer() {
    const [transcription, setTranscription] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const socketRef = useRef(null);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);

    // Initialize WebSocket connection and listen for transcription updates
    useEffect(() => {
        const socket = io('https://1c95-35-234-14-56.ngrok-free.app'
            , {
                extraHeaders: {
                    'ngrok-skip-browser-warning': 'true'
                },
                reconnectionAttempts: 5,  // Try reconnecting 5 times if disconnected
                reconnectionDelay: 1000   // Wait 1 second before each reconnection attempt
            }
        );
        socketRef.current = socket;

        socket.on('transcription', (data) => {
            setTranscription((prev) => prev + ' ' + data); // Append transcription
        });

        return () => {
            socket.disconnect(); // Cleanup WebSocket on component unmount
        };
    }, []);

    // Handle sending audio data to the server
    const buffer = [];

    const handleAudioData = (audioBlob) => {
        const reader = new FileReader();
        reader.onload = () => {
            const audioData = reader.result.split(',')[1]; // Base64-encoded audio data
            buffer.push(audioData); // Add to buffer

            if (buffer.length > 0 && socketRef.current) {
                socketRef.current.emit('audio_data', buffer.shift()); // Send from buffer
            }
        };
        reader.readAsDataURL(audioBlob);
    };


    // Start recording audio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true, // Helps reduce background noise
                    noiseSuppression: true, // Suppresses background noise
                    // sampleRate: 16000, // Set sample rate to match Vosk's requirements
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            const recorder = new RecordRTC(stream, {
                type: 'audio',
                mimeType: 'audio/wav',
                sampleRate: 44100,
                desiredSampRate: 16000,
                recorderType: StereoAudioRecorder,
                numberOfAudioChannels: 1,  // Set to mono channel
                timeSlice: 2000,  // Send audio data every second
                ondataavailable: (audioBlob) => {
                    handleAudioData(audioBlob);
                }
            });

            recorderRef.current = recorder;
            recorder.startRecording();
            setIsRecording(true);
            console.log('Started recording audio stream.');
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };


    // Stop recording audio
    const stopRecording = () => {
        if (recorderRef.current) {
            recorderRef.current.stopRecording(); // No need for callback here
            console.log('Stopped recording audio stream.');
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop()); // Stop microphone access
        }

        setIsRecording(false);
    };

    return (
        <div className="speech-recognizer">
            <div className="transcription-box">
                <h2>Transcription:</h2>
                <p>{transcription}</p>
            </div>
            <div className="button-container">
                {!isRecording ? (
                    <button className="record-button" onClick={startRecording}>
                        Start Recording
                    </button>
                ) : (
                    <button className="stop-button" onClick={stopRecording}>
                        Stop Recording
                    </button>
                )}
            </div>
        </div>
    );
}

export default SpeechRecognizer;
