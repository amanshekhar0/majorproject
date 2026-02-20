import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'dark:bg-cyber-dark dark:text-white',
                    duration: 4000,
                    style: {
                        background: 'var(--card)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>
);
