import mysql from 'mysql2/promise';
import 'dotenv/config';

async function clearDB() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log("Dropping existing tables to prevent Drizzle rename conflicts...");
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // We get all table names
    const [rows] = await conn.query('SHOW TABLES');
    const tableKeys = rows.map(r => Object.values(r)[0]);
    
    for(const table of tableKeys) {
        console.log(`Dropping ${table}...`);
        await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("Database cleared successfully!");
  } catch (err) {
    console.error("Failed to clear DB:", err);
  } finally {
    await conn.end();
  }
}

clearDB();
