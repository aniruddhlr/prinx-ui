// //this is half working, no error, but no text

// import React, { useState, useRef } from 'react';

// const WS_URL = 'ws://localhost:9090'; // Replace with your WebSocket server URL

// const SpeechRecognizer = () => {
//     const [recording, setRecording] = useState(false);
//     const [audioURL, setAudioURL] = useState(null);
//     const [audioBlob, setAudioBlob] = useState(null);
//     const [transcription, setTranscription] = useState('');
//     const [language, setLanguage] = useState('en');
//     const [translate, setTranslate] = useState(false);
//     const [model, setModel] = useState('small');
//     const [useVAD, setUseVAD] = useState(false);
//     const mediaRecorder = useRef(null);
//     const ws = useRef(null);

//     // Initialize WebSocket connection
//     const initWebSocket = () => {
//         ws.current = new WebSocket(WS_URL);

//         ws.current.onopen = () => {
//             console.log('Connected to WebSocket server');
//         };

//         // ws.current.onmessage = (event) => {
//         //     try {
//         //         // Handle transcription result from the server
//         //         console.log('event : ', event)
//         //         const text = event.data;
//         //         setTranscription(text);
//         //     } catch (err) {
//         //         console.error('Error processing WebSocket message', err);
//         //     }
//         // };

//         ws.current.onmessage = (event) => {
//             try {
//                 const data = JSON.parse(event.data);

//                 // Check if the response contains transcription segments
//                 if (data.segments) {
//                     const transcriptionText = data.segments.join(' ');
//                     setTranscription(transcriptionText);
//                 } else {
//                     console.log("Non-transcription message: ", data);
//                 }
//             } catch (err) {
//                 console.error('Error processing WebSocket message', err);
//             }
//         };


//         ws.current.onclose = () => {
//             console.log('WebSocket connection closed');
//         };

//         ws.current.onerror = (error) => {
//             console.error('WebSocket error', error);
//         };
//     };

//     // Initialize WebSocket when component mounts
//     React.useEffect(() => {
//         initWebSocket();
//         return () => {
//             if (ws.current) {
//                 ws.current.close();
//             }
//         };
//     }, []);

//     // Handle starting and stopping the recording
//     const startRecording = () => {
//         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//             alert('Your browser does not support audio recording.');
//             return;
//         }

//         navigator.mediaDevices.getUserMedia({ audio: true })
//             .then((stream) => {
//                 mediaRecorder.current = new MediaRecorder(stream);
//                 mediaRecorder.current.start();

//                 const audioChunks = [];
//                 mediaRecorder.current.ondataavailable = (event) => {
//                     audioChunks.push(event.data);
//                 };

//                 mediaRecorder.current.onstop = () => {
//                     const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
//                     setAudioBlob(audioBlob);
//                     const audioURL = URL.createObjectURL(audioBlob);
//                     setAudioURL(audioURL);
//                 };

//                 setRecording(true);
//             })
//             .catch((error) => {
//                 console.error('Error accessing microphone', error);
//                 alert('Error accessing your microphone.');
//             });
//     };

//     const stopRecording = () => {
//         if (mediaRecorder.current) {
//             mediaRecorder.current.stop();
//             setRecording(false);
//         }
//     };

//     // Convert audio blob to Base64
//     const blobToBase64 = (blob) => {
//         return new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 resolve(reader.result);
//             };
//             reader.onerror = reject;
//             reader.readAsDataURL(blob); // Read as Base64 encoded string
//         });
//     };

//     // Handle sending the recorded audio and parameters to the server
//     const sendAudio = async () => {
//         if (!audioBlob) {
//             alert('No audio recorded.');
//             return;
//         }

//         const base64Audio = await blobToBase64(audioBlob); // Convert Blob to Base64 string

//         if (ws.current && ws.current.readyState === WebSocket.OPEN) {
//             // Send the Base64 encoded audio and additional parameters to the server
//             const payload = {
//                 audio: base64Audio,
//                 language: language,
//                 task: 'transcribe',
//                 uid: 'test_client',
//                 translate: translate,
//                 model: model,
//                 use_vad: useVAD,
//                 save_output_recording: false,
//                 output_recording_filename: './output_recording.wav'
//             };

//             ws.current.send(JSON.stringify(payload));
//         } else {
//             alert('WebSocket connection is not open. Please try again.');
//         }
//     };

//     return (
//         <div>
//             <h1>Speech to Text - Record and Send Audio with Parameters</h1>

//             {/* Language selection */}
//             <label>
//                 Select Language:
//                 <select value={language} onChange={(e) => setLanguage(e.target.value)}>
//                     <option value="en">English</option>
//                     <option value="es">Spanish</option>
//                     <option value="fr">French</option>
//                     {/* Add other language options as needed */}
//                 </select>
//             </label>

//             {/* Translation option */}
//             <label>
//                 <input
//                     type="checkbox"
//                     checked={translate}
//                     onChange={() => setTranslate(!translate)}
//                 />
//                 Translate to English
//             </label>

//             {/* Model size selection */}
//             <label>
//                 Select Model Size:
//                 <select value={model} onChange={(e) => setModel(e.target.value)}>
//                     <option value="tiny">Tiny</option>
//                     <option value="small">Small</option>
//                     <option value="medium">Medium</option>
//                     <option value="large">Large</option>
//                 </select>
//             </label>

//             {/* Voice Activity Detection (VAD) option */}
//             <label>
//                 <input
//                     type="checkbox"
//                     checked={useVAD}
//                     onChange={() => setUseVAD(!useVAD)}
//                 />
//                 Use Voice Activity Detection (VAD)
//             </label>

//             {/* Record button */}
//             <button onClick={startRecording} disabled={recording}>
//                 {recording ? 'Recording...' : 'Start Recording'}
//             </button>

//             {/* Stop button */}
//             <button onClick={stopRecording} disabled={!recording}>
//                 Stop Recording
//             </button>

//             {/* Audio playback */}
//             {audioURL && (
//                 <div>
//                     <h2>Listen to Your Recording</h2>
//                     <audio controls src={audioURL} />
//                 </div>
//             )}

//             {/* Send audio button */}
//             <button onClick={sendAudio} disabled={!audioBlob}>
//                 Send Audio to Server
//             </button>

//             {/* Display transcription result */}
//             <div>
//                 <h2>Transcription:</h2>
//                 <p>{transcription || 'No transcription yet'}</p>
//             </div>
//         </div>
//     );
// };

// export default SpeechRecognizer;
