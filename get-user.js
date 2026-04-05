const mysql = require('mysql2/promise');
require('dotenv').config();

async function getFirstUser() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL
  });
  
  const [rows] = await connection.execute('SELECT id FROM users LIMIT 1');
  console.log("Valid User ID:", rows.length > 0 ? rows[0].id : "NONE");
  
  await connection.end();
}

getFirstUser();
