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
      WHERE table_name = 'assistance_records';
    `);
        console.log('Columns:');
        res.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));

        const count = await pool.query('SELECT COUNT(*) FROM assistance_records');
        console.log('Total records:', count.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
