import fetch from "node-fetch";

async function run() {
  console.log("Testing PMFBY Chat Endpoint...");
  
  // Need to provide a valid fake user-id to bypass auth if possible, or use the local-user-id fallback
  try {
    const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "local-user-id" },
        // Ask about enrollment - should trigger PMFBY logic and video link
        body: JSON.stringify({ question: "How to enroll in PMFBY?", language: "en" })
    });
    
    if (!res.ok) {
        console.error("Server returned:", res.status, await res.text());
        process.exit(1);
    }

    const data = await res.json();
    console.log("\n================ PMFBY TEST ================\n");
    console.log(data.answer);
  } catch (err) {
    console.error("Test Error:", err);
  }
}

run();
