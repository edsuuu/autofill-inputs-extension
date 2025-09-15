document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-salvar").addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const campos = document.querySelectorAll("input, textarea, select");

                return Array.from(campos)
                    .filter(input => {
                        if (!input.name && !input.id || input.id === '') return false;
                        if (["hidden", "submit", "button", "reset", "file"].includes(input.type)) return false;
                        if (input.name.startsWith("_")) return false;
                        if (["token", "method", "uri", "ip"].some(k => input.name.toLowerCase().includes(k))) return false;
                        return true;
                    }).map((field) => ({
                        name: field.name,
                        id: field.id,
                        value: field.value,
                    }));
            },
        });

        const key = tab.url;
        chrome.storage.local.set({ [key]: result }, () => {
            alert("Campos salvos com sucesso!");
            window.location.reload()
        });

    });


    document.getElementById("btn-options").addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("btn-toggle");
    const label = document.getElementById("toggle-label");

    const { enabled } = await chrome.storage.local.get("enabled");
    let isEnabled = enabled !== false;

    toggle.checked = isEnabled;
    atualizarLabel();

    toggle.addEventListener("change", async () => {
        isEnabled = toggle.checked;
        await chrome.storage.local.set({ enabled: isEnabled });
        atualizarLabel();
    });

    function atualizarLabel() {
        label.textContent = isEnabled ? "Ativado" : "Desativado";
        label.style.color = isEnabled ? "#2ecc71" : "#e74c3c";
    }
});