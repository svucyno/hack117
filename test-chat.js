async function testChat() {
    try {
        const res = await fetch("http://localhost:5000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": "1"
            },
            body: JSON.stringify({
                question: "what is the current market rate for paddy crop?",
                language: "en"
            })
        });
        const data = await res.json();
        console.log("MARKET TEST:\\n", JSON.stringify(data, null, 2));

        const res2 = await fetch("http://localhost:5000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": "1"
            },
            body: JSON.stringify({
                question: "what fertilizers are used more and less for my soil?",
                language: "en"
            })
        });
        const data2 = await res2.json();
        console.log("SOIL TEST:\\n", JSON.stringify(data2, null, 2));

    } catch(e) {
        console.error("Test failed", e);
    }
}
testChat();
