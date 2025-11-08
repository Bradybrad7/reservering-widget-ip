// Email Debug Component - Test binnen Vite context
import React, { useState, useEffect } from 'react';

const EmailDebugTest: React.FC = () => {
  const [log, setLog] = useState<string[]>(['Email debug component geladen...']);
  const [status, setStatus] = useState<{ message: string; type: string }>({ message: 'Ready for testing', type: 'info' });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `${timestamp} - ${message}`]);
  };

  const updateStatus = (message: string, type: 'info' | 'success' | 'error') => {
    setStatus({ message, type });
  };

  useEffect(() => {
    // Initial environment check
    checkEnvironment();
  }, []);

  const checkEnvironment = () => {
    addLog('🔧 Checking Vite environment variables...');
    
    const env = {
      DEV: import.meta.env.DEV,
      FORCE_EMAIL: import.meta.env.VITE_FORCE_EMAIL_IN_DEV,
      EMAIL_FROM: import.meta.env.VITE_EMAIL_FROM,
      EMAIL_FROM_NAME: import.meta.env.VITE_EMAIL_FROM_NAME,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD
    };
    
    addLog('Environment: ' + JSON.stringify(env, null, 2));
    
    if (env.FORCE_EMAIL === 'true') {
      updateStatus('✅ Environment OK - Email forcing enabled', 'success');
      addLog('✅ VITE_FORCE_EMAIL_IN_DEV is correctly set to "true"');
    } else {
      updateStatus('❌ Email forcing DISABLED - VITE_FORCE_EMAIL_IN_DEV: ' + env.FORCE_EMAIL, 'error');
      addLog('❌ PROBLEEM: VITE_FORCE_EMAIL_IN_DEV is niet "true"');
    }
  };

  const testEmailService = async () => {
    addLog('🧪 Testing email service within Vite context...');
    updateStatus('🔄 Testing email service...', 'info');
    
    try {
      addLog('📧 Testing direct Firebase Function call instead...');
      
      // Test direct Firebase Function call with proper data
      const emailData = {
        to: ['info@inspiration-point.nl'],
        subject: '🧪 VITE EMAIL SERVICE TEST - Admin Panel Debug',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px;">
              <h1>🧪 Email Service Test</h1>
              <p>Admin Panel Debug Tool</p>
            </div>
            <div style="background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px;">
              <h3>✅ Email Service Test Resultaat</h3>
              <p><strong>Test vanuit:</strong> Admin Panel Debug Component</p>
              <p><strong>Vite Context:</strong> DEV=${import.meta.env.DEV}</p>
              <p><strong>Force Email:</strong> ${import.meta.env.VITE_FORCE_EMAIL_IN_DEV}</p>
              <p><strong>Test tijd:</strong> ${new Date().toLocaleString('nl-NL')}</p>
              
              <div style="background: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>🎉 Als je deze email ontvangt werkt het email systeem perfect!</strong></p>
                <p>Dit betekent dat alle nieuwe boekingen automatisch emails zouden moeten versturen.</p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h4>🔍 Troubleshooting</h4>
                <p>Als echte boekingen nog steeds geen emails versturen:</p>
                <ul>
                  <li>Check of events bestaan in de database</li>
                  <li>Controleer of submitReservation functie correct wordt aangeroepen</li>
                  <li>Kijk naar browser console logs tijdens een echte boeking</li>
                </ul>
              </div>
            </div>
          </div>
        `,
        text: `Email Service Test - Admin Panel Debug\n\nVite Context: DEV=${import.meta.env.DEV}\nForce Email: ${import.meta.env.VITE_FORCE_EMAIL_IN_DEV}\nTest tijd: ${new Date().toLocaleString('nl-NL')}\n\nAls je deze email ontvangt werkt het email systeem perfect!`,
        from: 'info@inspiration-point.nl',
        fromName: 'Inspiration Point Debug'
      };
      
      addLog('📧 Calling Firebase Function via email service test...');
      
      const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      
      const result = await response.json();
      addLog('📧 Email service test result: ' + JSON.stringify(result, null, 2));

      if (result.success) {
        addLog('🎉 SUCCESS! Email service test successful');
        updateStatus('✅ Email service test successful! Check info@inspiration-point.nl inbox', 'success');
        addLog('📬 Email sent successfully via Firebase Function');
      } else {
        addLog('❌ FAILED! Email service test error: ' + result.error);
        updateStatus('❌ Email service test failed: ' + result.error, 'error');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog('🔥 ERROR during email service test: ' + errorMessage);
      updateStatus('🔥 Email service test error: ' + errorMessage, 'error');
    }
  };

  const testDirectFirebaseFunction = async () => {
    addLog('🚀 Testing direct Firebase Function call...');
    updateStatus('🔄 Testing Firebase Function...', 'info');
    
    try {
      const testData = {
        to: ['info@inspiration-point.nl'],
        subject: '🧪 VITE CONTEXT TEST - Direct Firebase Function Call',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px;">
              <h1>🧪 Vite Context Test</h1>
              <p>Direct Firebase Function Test</p>
            </div>
            <div style="background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px;">
              <h3>✅ Test Status: SUCCESS</h3>
              <p><strong>Context:</strong> Vite Development Environment</p>
              <p><strong>Test tijd:</strong> ${new Date().toLocaleString('nl-NL')}</p>
              <p><strong>Environment:</strong> DEV=${import.meta.env.DEV}, FORCE_EMAIL=${import.meta.env.VITE_FORCE_EMAIL_IN_DEV}</p>
              <div style="background: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>🎉 Als je deze email ontvangt, werkt Firebase Functions correct vanuit Vite!</strong></p>
              </div>
            </div>
          </div>
        `,
        text: `Vite Context Test - Direct Firebase Function\n\nTest tijd: ${new Date().toLocaleString('nl-NL')}\nEnvironment: DEV=${import.meta.env.DEV}\n\nAls je deze email ontvangt, werkt het systeem correct!`,
        from: 'info@inspiration-point.nl',
        fromName: 'Inspiration Point Vite Test'
      };

      addLog('📧 Calling Firebase Function directly...');
      addLog('   URL: https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail');
      
      const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      addLog('📨 Firebase Function result: ' + JSON.stringify(result, null, 2));
      
      if (result.success) {
        addLog('✅ SUCCESS! Direct Firebase Function call works');
        updateStatus('✅ Firebase Function test successful!', 'success');
      } else {
        addLog('❌ FAILED! Firebase Function error: ' + result.error);
        updateStatus('❌ Firebase Function test failed: ' + result.error, 'error');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog('🔥 ERROR calling Firebase Function: ' + errorMessage);
      updateStatus('🔥 Firebase Function error: ' + errorMessage, 'error');
    }
  };

  const clearLog = () => {
    setLog(['Log cleared...']);
    updateStatus('Ready for testing', 'info');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>🧪 Email Debug Test (Vite Context)</h1>
        
        <div style={{ 
          padding: '15px', 
          margin: '10px 0', 
          borderRadius: '5px', 
          backgroundColor: status.type === 'success' ? '#d4edda' : status.type === 'error' ? '#f8d7da' : '#cce7ff',
          color: status.type === 'success' ? '#155724' : status.type === 'error' ? '#721c24' : '#004085',
          border: `1px solid ${status.type === 'success' ? '#c3e6cb' : status.type === 'error' ? '#f5c6cb' : '#b3d9ff'}`
        }}>
          <strong>{status.message}</strong>
        </div>

        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={checkEnvironment}
            style={{ 
              background: '#2196F3', 
              color: 'white', 
              border: 'none', 
              padding: '12px 20px', 
              margin: '5px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔧 Check Environment
          </button>
          
          <button 
            onClick={testEmailService}
            style={{ 
              background: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              padding: '12px 20px', 
              margin: '5px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📧 Test Email Service
          </button>
          
          <button 
            onClick={testDirectFirebaseFunction}
            style={{ 
              background: '#FF9800', 
              color: 'white', 
              border: 'none', 
              padding: '12px 20px', 
              margin: '5px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚀 Test Firebase Function
          </button>
          
          <button 
            onClick={clearLog}
            style={{ 
              background: '#666', 
              color: 'white', 
              border: 'none', 
              padding: '12px 20px', 
              margin: '5px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Clear Log
          </button>
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          padding: '20px', 
          borderRadius: '5px',
          fontFamily: 'Courier New, monospace',
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflowY: 'auto',
          fontSize: '12px'
        }}>
          {log.join('\n')}
        </div>
      </div>
    </div>
  );
};

export default EmailDebugTest;