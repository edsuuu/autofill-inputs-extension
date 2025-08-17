document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("lista-sites");

    chrome.storage.local.get(null, (data) => {
        const urls = Object.keys(data);

        if (urls.length === 0) {
            lista.innerHTML = "<li>Nenhum formulário salvo ainda</li>";
            return;
        }

        urls.forEach((url) => {
            if (url === 'enabled') {
                return;
            }

            renderItem(url, data[url]);
        });
    });

    function renderItem(url, campos) {
        const li = document.createElement("li");
        li.dataset.url = url;

        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.innerText = url;

        const btnEditar = document.createElement("button");
        btnEditar.innerText = "Editar";
        btnEditar.addEventListener("click", () => editarItem(li, url, campos));

        const btnExcluir = document.createElement("button");
        btnExcluir.innerText = "Excluir";
        btnExcluir.addEventListener("click", () => {
            chrome.storage.local.remove(url, () => li.remove());
        });

        li.appendChild(link);
        li.appendChild(btnEditar);
        li.appendChild(btnExcluir);

        document.getElementById("lista-sites").appendChild(li);
    }

    function editarItem(li, url, campos) {
        li.innerHTML = `<strong>${url}</strong>`;

        const form = document.createElement("div");

        campos.forEach((campo, i) => {
            const wrapper = document.createElement("div");
            wrapper.className = "campo";

            const label = document.createElement("label");
            label.innerText = campo.name || campo.id || `Campo ${i + 1}`;

            const input = document.createElement("input");
            input.value = campo.value;
            input.dataset.index = i;

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            form.appendChild(wrapper);
        });

        const btnSalvar = document.createElement("button");
        btnSalvar.innerText = "Salvar";
        btnSalvar.addEventListener("click", () => {
            const novosCampos = campos.map((c, i) => {
                const novoValor = form.querySelector(`input[data-index="${i}"]`).value;
                return { ...c, value: novoValor };
            });

            chrome.storage.local.set({ [url]: novosCampos }, () => {
                li.remove();
                renderItem(url, novosCampos);
            });
        });

        const btnCancelar = document.createElement("button");
        btnCancelar.innerText = "Cancelar";
        btnCancelar.addEventListener("click", () => {
            li.remove();
            renderItem(url, campos);
        });

        form.appendChild(btnSalvar);
        form.appendChild(btnCancelar);
        li.appendChild(form);
    }
});