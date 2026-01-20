import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'persons';
    `);
        console.log('Columns in persons:');
        res.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
