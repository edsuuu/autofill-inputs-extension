import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { FixedBar } from './components/FixedBar';
import { AutofillProvider } from './context/AutofillContext';

const MOUNT_ID = 'autofill-extension-root';

async function init() {
    if (document.getElementById(MOUNT_ID)) return;

    const container = document.createElement('div');
    container.id = MOUNT_ID;
    
    const shadow = container.attachShadow({ mode: 'open' });
    
    try {
        const cssUrl = browser.runtime.getURL('global.css');
        const response = await fetch(cssUrl);
        const cssText = await response.text();
        const style = document.createElement('style');
        style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n${cssText}\n* { font-family: 'Inter', sans-serif !important; }`;
        shadow.appendChild(style);
    } catch (error) {
        console.error('AutoFill: Failed to load CSS', error);
    }

    const rootElement = document.createElement('div');
    shadow.appendChild(rootElement);
    document.body.prepend(container);

    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <AutofillProvider>
                <FixedBar />
            </AutofillProvider>
        </React.StrictMode>
    );

    browser.runtime.onMessage.addListener(async (message) => {
        if (message.action === 'SAVE_FORM') {
            const { AutofillService } = await import('./services/Autofill/AutofillService');
            const result = await AutofillService.captureAndSave(window.location.href);
            
            const event = new CustomEvent('autofill-toast', { 
                detail: { message: result.message, type: result.success ? 'success' : 'error' } 
            });
            window.dispatchEvent(event);
            
            return result;
        }
    });
}

if (window.top === window) {
    init();
}
