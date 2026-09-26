import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
console.log("Schema applied.");
const { rows } = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
);
console.log("Tables:", rows.map((r) => r.table_name).join(", "));
await client.end();
