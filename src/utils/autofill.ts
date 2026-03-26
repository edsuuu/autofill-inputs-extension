import browser from 'webextension-polyfill';
import { AutofillService } from '../services/Autofill/AutofillService';

(async function () {
    let isFilling = false;
    let debounceTimer: any = null;

    const tryAutoFill = async () => {
        if (isFilling) return;
        isFilling = true;
        try {
            // One attempt per trigger is enough with MutationObserver.
            await AutofillService.fillForm(window.location.href, true);
        } catch (error) {
            console.error('Erro ao tentar preenchimento automático:', error);
        } finally {
            isFilling = false;
        }
    };

    const triggerFill = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => tryAutoFill(), 500);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => tryAutoFill(), 500);
        });
    } else {
        setTimeout(() => tryAutoFill(), 500);
    }

    let lastUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            triggerFill();
        }
    }, 1000);

    const observer = new MutationObserver(() => {
        triggerFill();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    setTimeout(() => {
        observer.disconnect();
    }, 2000); // Increased to 5s to catch late-loading forms

    // Listen for profile changes to re-fill immediately
    browser.storage.onChanged.addListener((changes) => {
        if (changes.currentProfile) {
            tryAutoFill(); 
        }
    });
})();
