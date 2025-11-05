/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-unresolved */
/* eslint-disable func-style */
import { Helper } from './helper';

declare const chrome: {
    storage: {
        local: {
            get: (keys: string | string[]) => Promise<Record<string, unknown>>;
            set: (items: Record<string, unknown>) => Promise<void>;
        };
        onChanged: {
            addListener: (callback: (changes: Record<string, unknown>, namespace: string) => void) => void;
        };
    };
};

let floatingButton: HTMLElement | null = null;
let saveButton: HTMLElement | null = null;
let fillButton: HTMLElement | null = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let hasMoved = false;
let startPosition = { x: 0, y: 0 };

function showToast(message: string, type: 'success' | 'error' = 'success') {
    const existingToast = document.getElementById('autofill-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'autofill-toast';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.zIndex = '10000';
    toast.style.maxWidth = '300px';
    toast.style.wordWrap = 'break-word';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'transform 0.3s ease-in-out';
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';

    toast.textContent = message;

    const icon = document.createElement('span');
    icon.style.marginRight = '8px';
    icon.style.fontSize = '16px';
    icon.textContent = type === 'success' ? '✓' : '✕';
    toast.insertBefore(icon, toast.firstChild);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Função para criar o botão flutuante
function createFloatingButton() {
    if (floatingButton) {
        return;
    }

    // Container principal
    floatingButton = document.createElement('div');
    floatingButton.id = 'autofill-floating-button';
    floatingButton.style.position = 'fixed';
    floatingButton.style.boxSizing = 'content-box';
    floatingButton.style.flexShrink = '0';
    floatingButton.style.backgroundColor = '#1f2937';
    floatingButton.style.borderRadius = '12px';
    floatingButton.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    floatingButton.style.cursor = 'move';
    floatingButton.style.zIndex = '9999';
    floatingButton.style.display = 'flex';
    floatingButton.style.alignItems = 'center';
    floatingButton.style.justifyContent = 'space-between';
    floatingButton.style.padding = '8px';
    floatingButton.style.gap = '8px';
    floatingButton.style.right = '20px';
    floatingButton.style.bottom = '20px';
    floatingButton.title = 'Arraste para mover';

    // Botão de salvar
    saveButton = document.createElement('div');
    saveButton.id = 'autofill-save-button';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = '#10b981';
    saveButton.style.borderRadius = '8px';
    saveButton.style.display = 'flex';
    saveButton.style.alignItems = 'center';
    saveButton.style.justifyContent = 'center';
    saveButton.style.cursor = 'pointer';
    saveButton.style.transition = 'all 0.2s ease';
    saveButton.style.color = 'white';
    saveButton.style.fontSize = '14px';
    saveButton.style.fontWeight = '500';
    saveButton.style.whiteSpace = 'nowrap';
    saveButton.title = 'Salvar formulário';
    saveButton.textContent = 'Salvar';

    // Botão de preencher
    fillButton = document.createElement('div');
    fillButton.id = 'autofill-fill-button';
    fillButton.style.padding = '8px 16px';
    fillButton.style.backgroundColor = '#3b82f6';
    fillButton.style.borderRadius = '8px';
    fillButton.style.display = 'flex';
    fillButton.style.alignItems = 'center';
    fillButton.style.justifyContent = 'center';
    fillButton.style.cursor = 'pointer';
    fillButton.style.transition = 'all 0.2s ease';
    fillButton.style.color = 'white';
    fillButton.style.fontSize = '14px';
    fillButton.style.fontWeight = '500';
    fillButton.style.whiteSpace = 'nowrap';
    fillButton.title = 'Preencher formulário';
    fillButton.textContent = 'Preencher';

    // Adicionar botões ao container
    floatingButton.appendChild(saveButton);
    floatingButton.appendChild(fillButton);

    // Event listeners
    floatingButton.addEventListener('mousedown', handleMouseDown);
    saveButton.addEventListener('click', handleSaveClick);
    saveButton.addEventListener('mouseenter', () => {
        saveButton!.style.backgroundColor = '#059669';
    });
    saveButton.addEventListener('mouseleave', () => {
        saveButton!.style.backgroundColor = '#10b981';
    });
    fillButton.addEventListener('click', handleFillClick);
    fillButton.addEventListener('mouseenter', () => {
        fillButton!.style.backgroundColor = '#2563eb';
    });
    fillButton.addEventListener('mouseleave', () => {
        fillButton!.style.backgroundColor = '#3b82f6';
    });

    document.body.appendChild(floatingButton);
}

function removeFloatingButton() {
    if (floatingButton) {
        floatingButton.remove();
        floatingButton = null;
        saveButton = null;
        fillButton = null;
    }
}

function updateButtonPosition(x: number, y: number) {
    if (!floatingButton) return;

    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 60;

    const newX = Math.max(0, Math.min(x, maxX));
    const newY = Math.max(0, Math.min(y, maxY));

    floatingButton.style.left = `${newX}px`;
    floatingButton.style.top = `${newY}px`;
    floatingButton.style.right = 'auto';
    floatingButton.style.bottom = 'auto';
}

function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    isDragging = true;
    hasMoved = false;
    startPosition = { x: e.clientX, y: e.clientY };
    dragOffset = {
        x: e.clientX - floatingButton!.offsetLeft,
        y: e.clientY - floatingButton!.offsetTop
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !floatingButton) return;

    const deltaX = Math.abs(e.clientX - startPosition.x);
    const deltaY = Math.abs(e.clientY - startPosition.y);

    if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
    }

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    updateButtonPosition(newX, newY);

    chrome.storage.local.set({
        floatingButtonPosition: { x: newX, y: newY }
    });
}

function handleMouseUp() {
    isDragging = false;
    setTimeout(() => {
        hasMoved = false;
    }, 100);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

// Função para salvar formulário
async function handleSaveClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const helper = new Helper(false, window.location.href);
    const result = await helper.saveForm(window.location.href);
    showToast(result.message, result.success ? 'success' : 'error');
}

async function handleFillClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
        const fields = await Helper.getFieldsForUrl(window.location.href);
        if (!fields || fields.length === 0) {
            showToast('Nenhum formulário salvo para esta página!', 'error');
            return;
        }

        new Helper(false, window.location.href);

        showToast(`Formulário preenchido!`, 'success');
    } catch {
        showToast('Erro ao preencher o formulário.', 'error');
    }
}

async function checkFloatingButtonStatus() {
    try {
        const data = await chrome.storage.local.get(['floatingButton', 'floatingButtonPosition']);

        if (data.floatingButton) {
            createFloatingButton();

            const position = (data.floatingButtonPosition as { x: number; y: number }) || {
                x: window.innerWidth - 120,
                y: window.innerHeight - 68
            };
            updateButtonPosition(position.x, position.y);
        } else {
            removeFloatingButton();
        }
    } catch {
        // Silenciar erro
    }
}

// Listener para mudanças no storage
chrome.storage.onChanged.addListener((changes: Record<string, unknown>, namespace: string) => {
    if (namespace === 'local' && changes.floatingButton) {
        const floatingButtonChange = changes.floatingButton as { newValue: boolean };
        if (floatingButtonChange.newValue) {
            createFloatingButton();
            const positionChange = changes.floatingButtonPosition as { newValue: { x: number; y: number } } | undefined;
            const position = positionChange?.newValue || {
                x: window.innerWidth - 120,
                y: window.innerHeight - 68
            };
            updateButtonPosition(position.x, position.y);
        } else {
            removeFloatingButton();
        }
    }
});

checkFloatingButtonStatus();
