/* eslint-disable import/no-unresolved */
/* eslint-disable func-style */
// Botão flutuante para preenchimento de formulários
import { Helper } from './helper';

// Declarar chrome para TypeScript
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
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let hasMoved = false;
let startPosition = { x: 0, y: 0 };

// Função para criar e mostrar toast
function showToast(message: string, type: 'success' | 'error' = 'success') {
    // Remover toast existente se houver
    const existingToast = document.getElementById('autofill-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Criar toast
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

    // Adicionar ícone
    const icon = document.createElement('span');
    icon.style.marginRight = '8px';
    icon.style.fontSize = '16px';
    icon.textContent = type === 'success' ? '✓' : '✕';
    toast.insertBefore(icon, toast.firstChild);

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Remover após 3 segundos
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

    floatingButton = document.createElement('div');
    floatingButton.id = 'autofill-floating-button';
    floatingButton.style.position = 'fixed';
    floatingButton.style.width = '48px';
    floatingButton.style.height = '48px';
    floatingButton.style.backgroundColor = '#3b82f6';
    floatingButton.style.borderRadius = '50%';
    floatingButton.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    floatingButton.style.cursor = 'move';
    floatingButton.style.zIndex = '9999';
    floatingButton.style.display = 'flex';
    floatingButton.style.alignItems = 'center';
    floatingButton.style.justifyContent = 'center';
    floatingButton.style.right = '20px';
    floatingButton.style.bottom = '20px';
    floatingButton.title = 'Clique para preencher formulário ou arraste para mover';

    // Ícone SVG
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '24');
    icon.setAttribute('height', '24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.style.color = 'white';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z');

    icon.appendChild(path);
    floatingButton.appendChild(icon);

    // Event listeners
    floatingButton.addEventListener('mousedown', handleMouseDown);
    floatingButton.addEventListener('click', handleClick);

    document.body.appendChild(floatingButton);
}

// Função para remover o botão flutuante
function removeFloatingButton() {
    if (floatingButton) {
        floatingButton.remove();
        floatingButton = null;
    }
}

// Função para atualizar a posição do botão
function updateButtonPosition(x: number, y: number) {
    if (!floatingButton) return;

    const maxX = window.innerWidth - 48;
    const maxY = window.innerHeight - 48;

    const newX = Math.max(0, Math.min(x, maxX));
    const newY = Math.max(0, Math.min(y, maxY));

    floatingButton.style.left = `${newX}px`;
    floatingButton.style.top = `${newY}px`;
    floatingButton.style.right = 'auto';
    floatingButton.style.bottom = 'auto';
}

// Event handlers
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

    // Verificar se o mouse se moveu significativamente (mais de 5 pixels)
    const deltaX = Math.abs(e.clientX - startPosition.x);
    const deltaY = Math.abs(e.clientY - startPosition.y);

    if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
    }

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    updateButtonPosition(newX, newY);

    // Salvar posição no storage
    chrome.storage.local.set({
        floatingButtonPosition: { x: newX, y: newY }
    });
}

function handleMouseUp() {
    isDragging = false;
    // Reset hasMoved após um pequeno delay para permitir que o clique seja processado
    setTimeout(() => {
        hasMoved = false;
    }, 100);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

async function handleClick(e: MouseEvent) {
    // Se estava arrastando ou se moveu significativamente, não executar o clique
    if (isDragging || hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    try {
        // Verificar se há dados salvos para esta URL
        const data = await chrome.storage.local.get(window.location.href);
        if (!data || !data[window.location.href]) {
            showToast('Nenhum formulário salvo para esta página!', 'error');
            return;
        }

        // Usar a classe Helper para preencher os campos
        new Helper(false, window.location.href);

        // Aguardar um pouco para o preenchimento acontecer
        setTimeout(() => {
            // Verificar quantos campos foram preenchidos
            const fields = data[window.location.href];
            if (Array.isArray(fields) && fields.length > 0) {
                showToast(`Formulário preenchido! ${fields.length} campo(s) processado(s).`, 'success');
            } else {
                showToast('Nenhum campo compatível encontrado para preenchimento.', 'error');
            }
        }, 500);

    } catch {
        showToast('Erro ao preencher o formulário.', 'error');
    }
}

// Função para verificar se o botão deve ser mostrado
async function checkFloatingButtonStatus() {
    try {
        const data = await chrome.storage.local.get(['floatingButton', 'floatingButtonPosition']);

        if (data.floatingButton) {
            createFloatingButton();

            // Definir posição inicial (canto inferior direito)
            const position = (data.floatingButtonPosition as { x: number; y: number }) || {
                x: window.innerWidth - 68,
                y: window.innerHeight - 68
            };
            updateButtonPosition(position.x, position.y);
        } else {
            removeFloatingButton();
        }
    } catch {
        // Silenciar erro para não poluir o console
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
                x: window.innerWidth - 68,
                y: window.innerHeight - 68
            };
            updateButtonPosition(position.x, position.y);
        } else {
            removeFloatingButton();
        }
    }
});

// Inicializar quando o script carregar
checkFloatingButtonStatus();
