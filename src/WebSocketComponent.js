// WebSocketComponent.js
import React, { useEffect, useState } from 'react';

const WebSocketComponent = () => {
    const [ws, setWs] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        // Create WebSocket connection
        const socket = new WebSocket('ws://localhost:9090');

        // Open WebSocket connection
        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        // Handle incoming messages from WebSocket
        socket.onmessage = (event) => {
            console.log('Message from server: ', event.data);
        };

        // Handle WebSocket closing
        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        // Handle errors
        socket.onerror = (error) => {
            console.error('WebSocket error: ', error);
        };

        // Set the WebSocket instance
        setWs(socket);

        // Cleanup the WebSocket connection on component unmount
        return () => {
            socket.close();
        };
    }, []);

    const startRecording = async () => {
        // Request permission to access microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create MediaRecorder instance
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        // Handle data available event to capture audio chunks
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                console.log('Audio chunk:', event.data);  // Log the audio chunk before sending
                ws.send(event.data);  // Send audio chunk to WebSocket server
                console.log('Sending audio chunk to WebSocket server');
            }
        };


        // Start recording
        recorder.start(250); // 250ms timeslice for small chunks
        setIsRecording(true);
        console.log('Recording started');
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
            console.log('Recording stopped');
        }
    };

    return (
        <div>
            <h1>WebSocket Audio Streaming</h1>
            <button onClick={startRecording} disabled={isRecording}>
                Start Recording
            </button>
            <button onClick={stopRecording} disabled={!isRecording}>
                Stop Recording
            </button>
        </div>
    );
};

export default WebSocketComponent;
