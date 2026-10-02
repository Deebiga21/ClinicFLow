import React, { useState, useEffect } from 'react';

const PipelinePage = () => {
  const [pipelineState, setPipelineState] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [wsMessages, setWsMessages] = useState([]);

  useEffect(() => {
    // Fetch initial state
    fetch('http://localhost:8000/api/pipeline/state')
      .then(res => res.json())
      .then(data => setPipelineState(data))
      .catch(err => console.error(err));

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setWsMessages(prev => [data, ...prev].slice(0, 5)); // keep last 5
    };
    return () => ws.close();
  }, []);

  const runTestFlow = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/pipeline/test-flow');
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ClinicFlow Intelligence Pipeline</h1>
      
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>1. THE BASE PIPELINE / DATA FLOW</h3>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
{`DATABASE
   ↓
BACKEND SERVICES
   ↓
ML FEATURE ENGINEERING
   ↓
ML MODELS
   ↓
PREDICTIONS
   ↓
FRONTEND`}
          </pre>
        </div>

        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>2. LIVE CLINIC STATE</h3>
          {pipelineState ? (
            <ul>
              <li>Patients Waiting: {pipelineState.waiting_count}</li>
              <li>Patients in Consultation: {pipelineState.in_consultation_count}</li>
              <li>ML Models Loaded: {pipelineState.models_loaded ? 'Yes' : 'No'}</li>
            </ul>
          ) : (
            <p>Loading state from core backend...</p>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #2196F3', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>3. END-TO-END PATIENT LIFECYCLE TEST</h3>
        <p>This will simulate a patient checking in, receiving a waiting time prediction, starting consultation, and recording the actual duration for ML feedback.</p>
        <button 
          onClick={runTestFlow}
          style={{ background: '#2196F3', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
        >
          Run Pipeline Flow Test
        </button>

        {testResult && (
          <div style={{ marginTop: '1.5rem', background: '#e3f2fd', padding: '1rem', borderRadius: '4px' }}>
            <h4>Test Output:</h4>
            {testResult.flow.map((step, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #bbdefb' }}>
                <strong>Event: {step.event}</strong>
                <pre>{JSON.stringify(step, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3>4. REAL-TIME WEBSOCKET EVENTS</h3>
        <div style={{ background: '#333', color: '#0f0', padding: '1rem', borderRadius: '4px', minHeight: '150px', fontFamily: 'monospace' }}>
          {wsMessages.length === 0 && <p>No events yet. Run the flow to see events broadcasted.</p>}
          {wsMessages.map((msg, i) => (
            <div key={i}>[{new Date().toLocaleTimeString()}] {JSON.stringify(msg)}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
