// background.js

async function callOpenAI(promptText) {
    const { apiKey } = await chrome.storage.local.get("apiKey"); // Obtener la API key del almacenamiento local

    if (!apiKey) {
        throw new Error("API key no configurada.");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Resumí el siguiente texto:' },
                { role: 'user', content: promptText }
            ],
            max_tokens: 150,
            temperature: 0.5
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en la API: ${response.status} - ${errorText}`); // Log detallado
        throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Respuesta de OpenAI:", data); // Log de la respuesta
    return data.choices[0].message.content;
}

// Escuchar mensajes desde el content-script o popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SUMMARY_REQUEST') {
        callOpenAI(message.text)
            .then(summary => sendResponse({ summary }))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Necesario para respuestas async
    }
});

