import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function init() {
    const client = await pool.connect();
    try {
        console.log('Creating users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const users = [
            { username: 'okanpolat', password: 'password123', full_name: 'Okan POLAT' },
            { username: 'kursaddagdelen', password: 'password123', full_name: 'Kürşad DAĞDELEN' },
            { username: 'harunsahin', password: 'password123', full_name: 'Harun ŞAHİN' },
            { username: 'osmangul', password: 'password123', full_name: 'Osman GÜL' },
            { username: 'eliftug', password: 'password123', full_name: 'Elif TUĞ' }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await client.query(`
                INSERT INTO users (username, password, full_name)
                VALUES ($1, $2, $3)
                ON CONFLICT (username) DO UPDATE 
                SET password = EXCLUDED.password, full_name = EXCLUDED.full_name;
            `, [user.username, hashedPassword, user.full_name]);
            console.log(`User created/updated: ${user.username}`);
        }

        console.log('Database initialization complete.');
    } catch (err) {
        console.error('Initialization error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

init();
