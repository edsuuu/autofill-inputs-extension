/* eslint-disable import/no-unresolved */
import { Helper } from './helper';

(async function () {
    // Aguardar o DOM estar pronto e tentar múltiplas vezes
    const tryAutoFill = async (attempts = 10, delay = 300) => {
        for (let i = 0; i < attempts; i++) {
            try {
                // Verificar se encontrou campos antes de tentar preencher
                const fields = await Helper.getFieldsForUrl(window.location.href);

                if (fields && fields.length > 0) {
                    // Se encontrou campos, aguardar um pouco mais e executar
                    await new Promise(resolve => setTimeout(resolve, delay));

                    const helper = new Helper(true, window.location.href);
                    await helper.autoFill(window.location.href, true);
                    return;
                }
            } catch (error) {
                console.error('Erro ao tentar preenchimento automático:', error);
            }

            // Aguardar antes da próxima tentativa
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Tentar imediatamente se o DOM já estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => tryAutoFill(), 500);
        });
    } else {
        setTimeout(() => tryAutoFill(), 500);
    }

    // Também tentar quando a URL mudar (para SPAs)
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            setTimeout(() => tryAutoFill(), 500);
        }
    };

    // Observar mudanças na URL
    setInterval(checkUrlChange, 1000);

    // Observar mudanças no DOM (para páginas dinâmicas) por 3 segundos
    const observer = new MutationObserver(() => {
        setTimeout(() => tryAutoFill(3, 200), 500);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Desconectar o observer após 3 segundos para evitar loops e travamentos
    setTimeout(() => {
        observer.disconnect();
    }, 3000);
})();
