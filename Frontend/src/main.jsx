import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import { SocketProvider } from './contexts/SocketContext'; // 👈 Asegúrate que esté bien importado
import { AccountProvider } from './contexts/AccountContext';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="280041757836-7311jil21qr2ifgeg8b6gqdc3esmi299.apps.googleusercontent.com">
    <BrowserRouter>
      <SocketProvider>
        <AccountProvider>
          <App />
        </AccountProvider>
      </SocketProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
