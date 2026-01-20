import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        const res = await pool.query('SELECT id, file_no, central_assistance FROM persons WHERE central_assistance IS NOT NULL');
        console.log(`Checking ${res.rows.length} records...`);

        for (const row of res.rows) {
            let data;
            try {
                data = JSON.parse(row.central_assistance);
            } catch (e) { continue; }

            if (Array.isArray(data) && data.length > 5 && data[0] === '[' && (data.includes('"') || data.includes("'"))) {
                console.log(`Found corrupt data for file_no: ${row.file_no}`);
                try {
                    const joined = data.join('');
                    const repaired = JSON.parse(joined);
                    if (Array.isArray(repaired)) {
                        await pool.query('UPDATE persons SET central_assistance = $1 WHERE id = $2', [JSON.stringify(repaired), row.id]);
                        console.log(`Successfully repaired record ${row.id} (${row.file_no})`);
                    }
                } catch (e) {
                    console.error(`Failed to repair record ${row.id}:`, e);
                }
            }
        }
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}
migrate();
