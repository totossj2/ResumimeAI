function copySelection() {
    chrome.storage.local.get("autoCopy", ({ autoCopy }) => {
        if (!autoCopy) return;

        const selectedText = window.getSelection().toString().trim();

        if (selectedText) {
            // Copiar al portapapeles (si la opción está activa)
            document.execCommand("Copy");

            // Enviar el texto a background.js para que lo resuma
            chrome.runtime.sendMessage(
                { type: "SUMMARY_REQUEST", text: selectedText },
                (response) => {
                    if (response?.summary) {
                        // Mostrar el resumen (esto lo podemos mejorar después con UI)
                        console.log("Resumen:", response.summary);
                    } else {
                        console.error("Error al resumir:", response?.error);
                    }
                }
            );
        }
    });
}

document.addEventListener("mouseup", copySelection);
