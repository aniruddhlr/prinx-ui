import React, { useEffect, useState } from 'react';

const AudioCapture = () => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [audioResources, setAudioResources] = useState(null);
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let stream;
        let audioContext;
        let source;
        let processor;

        const connectWebSocket = () => {
            const ws = new WebSocket('ws://localhost:9090');

            ws.onopen = () => {
                console.log("WebSocket connected");
                ws.send(
                    JSON.stringify({
                        uid: crypto.randomUUID(),
                        language: "en",
                        model: "small",
                        task: "transcribe",
                        use_vad: false,
                    })
                );
            };

            ws.onerror = (error) => console.error("WebSocket Error:", error);

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const segments = data.segments;
                console.log(segments)
                setMessage(segments.map((seg) => seg.text).join(""));

            };

            ws.onclose = () => {
                console.log("WebSocket closed. Attempting to reconnect...");
                setTimeout(connectWebSocket, 3000); // Retry connection
            };

            return ws;
        };

        const startAudioCapture = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                source = audioContext.createMediaStreamSource(stream);
                processor = audioContext.createScriptProcessor(4096, 1, 1);

                const ws = connectWebSocket();

                source.connect(processor);
                processor.connect(audioContext.destination);

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const buffer = new Float32Array(inputData);

                    // Check if the WebSocket is open before sending
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(buffer);
                    } else {
                        console.error("WebSocket not open. Current state:", ws?.readyState);
                    }
                };

                setSocket(ws);
                setAudioResources({ stream, audioContext, source, processor });
            } catch (err) {
                console.error("The following getUserMedia error occurred: ", err);
            }
        };

        const stopAudioCapture = () => {
            if (audioResources) {
                const { stream, audioContext, source, processor } = audioResources;
                processor.onaudioprocess = null; // Cleanup the event handler
                processor.disconnect();
                source.disconnect();
                stream.getTracks().forEach((track) => track.stop());
                audioContext.close();
                socket?.close();
                setAudioResources(null);
                setMessage("");
            }
        };

        if (isCapturing) {
            startAudioCapture();
        } else {
            stopAudioCapture();
        }

        return () => {
            stopAudioCapture();
        };
    }, [isCapturing]);

    return (
        <div className="grid grid-cols-2">
            <button onClick={() => setIsCapturing(!isCapturing)} disabled={isCapturing}>
                {isCapturing ? "Stop Capturing" : "Start Capturing"}
            </button>
            <div className="flex flex-col gap-2 w-96">
                <h1 className="font-bold text-xl">Audio Output</h1>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default AudioCapture;
