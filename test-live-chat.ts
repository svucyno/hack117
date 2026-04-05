import { db } from "./server/db";
import { users } from "./shared/schema";

async function getUserId() {
  const result = await db.select().from(users).limit(1);
  if (result.length > 0) return result[0].id;
  return null;
}

async function run() {
  const userId = await getUserId();
  if(!userId) {
     console.log("No user found in database. Cannot test.");
     process.exit(1);
  }
  
  console.log("Running Chatbot Test...");
  
  // Test 1: Market Data
  let res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ question: "What is the market rate for paddy?", language: "en" })
  });
  let data = await res.json();
  console.log("\n================ MARKET TEST ================\n");
  console.log(data.answer);
  
  // Test 2: Soil Health Data
  res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ question: "What fertilizers should I use more or less of for my soil?", language: "en" })
  });
  data = await res.json();
  console.log("\n================ SOIL TEST ================\n");
  console.log(data.answer);
  
  process.exit(0);
}
run();
