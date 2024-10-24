import React from 'react';
import { Routes, Route } from "react-router-dom";
import SpeechRecognizer from './SpeechRecognizer';
// import WebSocketComponent from './WebSocketComponent';
import AudioCapture from './AudioCapture';



function App() {
  return (
    <div>
      <AudioCapture />
    </div>

  );
}

export default App;