import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';  // Importa GoogleOAuthProvider
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  
    <GoogleOAuthProvider clientId="280041757836-7311jil21qr2ifgeg8b6gqdc3esmi299.apps.googleusercontent.com">   {/* Agrega tu Client ID de Google aquí */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
);
