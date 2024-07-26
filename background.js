// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "sendJobToText") {
        const { apiKey, apiSecret, to, from, text } = message;
        const url = `https://rest.nexmo.com/sms/json`;
        const params = new URLSearchParams();
        params.append("api_key", apiKey);
        params.append("api_secret", apiSecret);
        params.append("to", to);
        params.append("from", from);
        params.append("text", text);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received response from Nexmo API:", data);
            sendResponse(data);
        })
        .catch(error => {
            console.error('Error sending request to Nexmo API:', error);
            sendResponse({ error: "Error sending request to Nexmo API" });
        });

        // Return true to indicate that sendResponse will be called asynchronously
        return true;
    }
});