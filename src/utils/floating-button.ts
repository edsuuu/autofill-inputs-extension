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
    floatingButton.style.width = '70px';
    floatingButton.style.height = '48px';
    floatingButton.style.backgroundColor = '#1f2937';
    floatingButton.style.borderRadius = '24px';
    floatingButton.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    floatingButton.style.cursor = 'move';
    floatingButton.style.zIndex = '9999';
    floatingButton.style.display = 'flex';
    floatingButton.style.alignItems = 'center';
    floatingButton.style.justifyContent = 'space-between';
    floatingButton.style.padding = '0 8px';
    floatingButton.style.right = '20px';
    floatingButton.style.bottom = '20px';
    floatingButton.title = 'Arraste para mover';

    // Botão de salvar
    saveButton = document.createElement('div');
    saveButton.id = 'autofill-save-button';
    saveButton.style.width = '32px';
    saveButton.style.height = '32px';
    saveButton.style.backgroundColor = '#10b981';
    saveButton.style.borderRadius = '50%';
    saveButton.style.display = 'flex';
    saveButton.style.alignItems = 'center';
    saveButton.style.justifyContent = 'center';
    saveButton.style.cursor = 'pointer';
    saveButton.style.transition = 'all 0.2s ease';
    saveButton.title = 'Salvar formulário';

    // Ícone de salvar (download)
    const saveIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    saveIcon.setAttribute('width', '16');
    saveIcon.setAttribute('height', '16');
    saveIcon.setAttribute('fill', 'none');
    saveIcon.setAttribute('stroke', 'currentColor');
    saveIcon.setAttribute('viewBox', '0 0 24 24');
    saveIcon.style.color = 'white';

    const savePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    savePath.setAttribute('stroke-linecap', 'round');
    savePath.setAttribute('stroke-linejoin', 'round');
    savePath.setAttribute('stroke-width', '2');
    savePath.setAttribute('d', 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z');

    saveIcon.appendChild(savePath);
    saveButton.appendChild(saveIcon);

    // Botão de preencher
    fillButton = document.createElement('div');
    fillButton.id = 'autofill-fill-button';
    fillButton.style.width = '32px';
    fillButton.style.height = '32px';
    fillButton.style.backgroundColor = '#3b82f6';
    fillButton.style.borderRadius = '50%';
    fillButton.style.display = 'flex';
    fillButton.style.alignItems = 'center';
    fillButton.style.justifyContent = 'center';
    fillButton.style.cursor = 'pointer';
    fillButton.style.transition = 'all 0.2s ease';
    fillButton.title = 'Preencher formulário';

    // Ícone de preencher (edit)
    const fillIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fillIcon.setAttribute('width', '16');
    fillIcon.setAttribute('height', '16');
    fillIcon.setAttribute('fill', 'none');
    fillIcon.setAttribute('stroke', 'currentColor');
    fillIcon.setAttribute('viewBox', '0 0 24 24');
    fillIcon.style.color = 'white';

    const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fillPath.setAttribute('stroke-linecap', 'round');
    fillPath.setAttribute('stroke-linejoin', 'round');
    fillPath.setAttribute('stroke-width', '2');
    fillPath.setAttribute('d', 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z');

    fillIcon.appendChild(fillPath);
    fillButton.appendChild(fillIcon);

    // Adicionar botões ao container
    floatingButton.appendChild(saveButton);
    floatingButton.appendChild(fillButton);

    // Event listeners
    floatingButton.addEventListener('mousedown', handleMouseDown);
    saveButton.addEventListener('click', handleSaveClick);
    saveButton.addEventListener('mouseenter', () => {
        saveButton!.style.transform = 'scale(1.1)';
        saveButton!.style.backgroundColor = '#059669';
    });
    saveButton.addEventListener('mouseleave', () => {
        saveButton!.style.transform = 'scale(1)';
        saveButton!.style.backgroundColor = '#10b981';
    });
    fillButton.addEventListener('click', handleFillClick);
    fillButton.addEventListener('mouseenter', () => {
        fillButton!.style.transform = 'scale(1.1)';
        fillButton!.style.backgroundColor = '#2563eb';
    });
    fillButton.addEventListener('mouseleave', () => {
        fillButton!.style.transform = 'scale(1)';
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

    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 48;

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

    try {
        // Capturar todos os campos do formulário
        const inputs = Array.from(document.querySelectorAll("input, textarea, select")) as HTMLInputElement[];
        const fields = Array.from(inputs)
            .filter((input) => {
                if ((!input.name && !input.id) || input.id === '') return false;
                if (['hidden', 'submit', 'button', 'reset', 'file'].includes(input.type)) return false;
                if (input.name.startsWith('_')) return false;
                if (['token', 'method', 'uri', 'ip'].some((k) => input.name.toLowerCase().includes(k))) return false;
                return true;
            })
            .map((field) => ({
                name: field.name,
                id: field.id,
                value: field.type === 'checkbox' ? field.checked :
                    field.type === 'radio' ? (field.checked ? field.value : '') :
                        field.value,
                type: field.type,
            }));

        if (fields.length === 0) {
            showToast('Nenhum campo encontrado para salvar!', 'error');
            return;
        }

        // Salvar no storage
        await chrome.storage.local.set({
            [window.location.href]: fields
        });

        showToast(`Formulário salvo! ${fields.length} campo(s) capturado(s).`, 'success');

    } catch {
        showToast('Erro ao salvar o formulário.', 'error');
    }
}

async function handleFillClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
        const data = await chrome.storage.local.get(window.location.href);
        if (!data || !data[window.location.href]) {
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
