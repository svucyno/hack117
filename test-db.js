import mysql from 'mysql2/promise';
import 'dotenv/config';

async function test() {
  console.log("Testing connection with DATABASE_URL:", process.env.DATABASE_URL);
  
  try {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'student',
        password: 'Student@123',
        database: 'agripredict',
        port: 3306
    });
    console.log("SUCCESS: Connected with Object Config (Student@123)");
    await conn.end();
    return;
  } catch (err) {
    console.error("FAIL 1 Object:", err.message);
  }

  try {
    const connX = await mysql.createConnection({
        host: 'localhost',
        user: 'student',
        password: 'Student@123',
        database: 'agripredict',
        port: 3306
    });
    console.log("SUCCESS: Connected with Object Config (Blank Password)");
    await connX.end();
    return;
  } catch (errX) {
    console.error("FAIL Blank Object:", errX.message);
  }

  const url2 = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');
  console.log("\nTesting connection with 127.0.0.1:", url2);
  try {
    const conn2 = await mysql.createConnection(url2);
    console.log("SUCCESS: Connected with 127.0.0.1");
    await conn2.end();
    return;
  } catch(err2) {
    console.error("FAIL 2:", err2.message);
  }

  // Try decoding the @ symbol if it was %40
  const url3 = url2.replace('%40', '@');
  console.log("\nTesting connection with decoded @:", url3);
  try {
    const conn3 = await mysql.createConnection(url3);
    console.log("SUCCESS: Connected with decoded @");
    await conn3.end();
    return;
  } catch(err3) {
    console.error("FAIL 3:", err3.message);
  }

  // Try the most common XAMPP setup: no password
  const url4 = "mysql://root:@localhost:3306/agripredict";
  console.log("\nTesting connection with NO password:", url4);
  try {
    const conn4 = await mysql.createConnection(url4);
    console.log("SUCCESS: Connected with NO password format!");
    await conn4.end();
    return;
  } catch(err4) {
    console.error("FAIL 4:", err4.message);
  }
}

test();
