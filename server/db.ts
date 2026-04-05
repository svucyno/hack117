import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";

dotenv.config();

// Default local environment variables for XAMPP/WAMP MySQL
const connectionStr = process.env.DATABASE_URL || "mysql://student:Student%40123@localhost:3306/agripredict";

export const poolConnection = mysql.createPool({
  uri: connectionStr,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(poolConnection, { schema, mode: "default" });