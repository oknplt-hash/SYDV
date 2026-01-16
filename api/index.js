import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import sharp from 'sharp';
import ExcelJS from 'exceljs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { Readable } from 'stream';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database Connection
console.log('Database connecting to:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'UNDEFINED');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Constants
const BULLET_PREFIX_RE = /^[\-\*\u2022\u2023\u25AA\u25CF\s]+/;
const STAR_BREAK_RE = /(?<!^)(?<!\n)(\*+)/g;
const NUMBER_BREAK_RE = /(?<!^)(?<!\n)(\d{1,2}\s*[.\-):])/g;
const UPPER_BREAK_RE = /(?<!^)(?<!\n)\s{3,}(?=[A-ZÇĞİÖŞÜ])/g;
const CURRENCY_BREAK_RE = /(?<=TL)\s+(?=[A-ZÇĞİÖŞÜ])/g;

// Utilities
const parseIntSafe = (val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
};

const parseFloatSafe = (val) => {
    if (!val) return null;
    const cleaned = String(val).replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
};

const normalizeDescription = (text) => {
    if (!text) return [];
    let normalized = text.replace(/\r\n/g, '\n');
    normalized = normalized.replace(STAR_BREAK_RE, '\n$1');
    normalized = normalized.replace(NUMBER_BREAK_RE, '\n$1');
    normalized = normalized.replace(UPPER_BREAK_RE, '\n');
    normalized = normalized.replace(CURRENCY_BREAK_RE, '\n');
    normalized = normalized.replace(/\n{2,}/g, '\n');

    let segments = normalized.split(/\n+/).map(s => s.trim()).filter(Boolean);

    if (segments.length <= 1) {
        let baseText = segments[0] || text.trim();
        if (baseText) {
            baseText = baseText.replace(STAR_BREAK_RE, '\n$1');
            baseText = baseText.replace(NUMBER_BREAK_RE, '\n$1');
            baseText = baseText.replace(UPPER_BREAK_RE, '\n');
            baseText = baseText.replace(CURRENCY_BREAK_RE, '\n');
            baseText = baseText.replace(/\n{2,}/g, '\n');

            const candidates = baseText.split(/(?<=[.!?;:])\s+/);
            const refined = [];
            for (let candidate of candidates) {
                let original = candidate.trim();
                let cleaned = original.replace(BULLET_PREFIX_RE, '');
                if (original.startsWith('**') && !cleaned.startsWith('**')) {
                    cleaned = '**' + cleaned;
                }
                if (!cleaned) continue;
                if (cleaned.length > 110 && cleaned.includes(',')) {
                    refined.push(...cleaned.split(',').map(p => p.trim()).filter(Boolean));
                } else {
                    refined.push(cleaned);
                }
            }
            segments = refined;
        }
    }
    return segments;
};

const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birthDate = DateTime.fromISO(birthDateStr);
    if (!birthDate.isValid) return null;
    const now = DateTime.now();
    const age = Math.floor(now.diff(birthDate, 'years').years);
    return age >= 0 ? age : null;
};

// Storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes

// Persons API
app.get('/api/persons', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const offset = (page - 1) * perPage;
    const search = req.query.search || '';

    try {
        let countQuery = 'SELECT COUNT(*) as total FROM persons';
        let dataQuery = `SELECT id, file_no, full_name, phone, social_security, created_at, updated_at
                       FROM persons`;
        let countParams = [];
        let dataParams = [perPage, offset];

        if (search) {
            const searchPattern = `%${search}%`;
            const whereClause = ' WHERE (full_name ILIKE $1 OR file_no ILIKE $1 OR CAST(national_id AS TEXT) ILIKE $1)';
            countQuery += whereClause;
            countParams.push(searchPattern);

            dataQuery += ' WHERE (full_name ILIKE $3 OR file_no ILIKE $3 OR CAST(national_id AS TEXT) ILIKE $3)';
            dataParams.push(searchPattern);
        }

        dataQuery += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';

        const totalResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(totalResult.rows[0].total);

        const result = await pool.query(dataQuery, dataParams);

        res.json({
            persons: result.rows,
            total_count: totalCount,
            page,
            per_page: perPage,
            total_pages: Math.ceil(totalCount / perPage) || 1
        });
    } catch (error) {
        console.error('DATABASE ERROR in /api/persons:', error);
        res.status(500).json({ error: 'Veritabanı hatası: ' + error.message });
    }
});

app.get('/api/persons/check/:file_no', async (req, res) => {
    try {
        const { file_no } = req.params;
        const result = await pool.query('SELECT id, full_name FROM persons WHERE file_no = $1', [file_no]);
        if (result.rows.length > 0) {
            return res.json({ exists: true, person: result.rows[0] });
        }
        res.json({ exists: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/person/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM persons WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Person not found' });

        const person = result.rows[0];

        // Fetch assistance records
        const assistanceResult = await pool.query(
            'SELECT id, assistance_type, assistance_date, assistance_amount FROM assistance_records WHERE person_id = $1 ORDER BY assistance_date DESC',
            [person.id]
        );

        // Fetch household images (metadata only)
        const imagesResult = await pool.query(
            'SELECT id, filename FROM household_images WHERE person_id = $1 ORDER BY id',
            [person.id]
        );

        res.json({
            ...person,
            assistance_records: assistanceResult.rows,
            household_images: imagesResult.rows,
            has_profile_photo: !!person.profile_photo,
            household_description_lines: normalizeDescription(person.household_description)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/person/new', upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'household_images' }
]), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const b = req.body;
        const now = new Date().toISOString();

        // Server-side duplicate check
        const checkResult = await client.query('SELECT id FROM persons WHERE file_no = $1', [b.file_no]);
        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Bu dosya numarası (${b.file_no}) zaten kayıtlı!` });
        }

        const result = await client.query(
            `INSERT INTO persons (
        file_no, full_name, national_id, birth_date, spouse_name, household_size,
        children_count, student_count, phone, address, social_security,
        disability_status, disability_rate, central_assistance,
        household_description, household_income, per_capita_income,
        profile_photo, profile_photo_filename, profile_photo_mimetype,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING id`,
            [
                b.file_no, b.full_name, b.national_id, b.birth_date || null, b.spouse_name, parseIntSafe(b.household_size),
                parseIntSafe(b.children_count), parseIntSafe(b.student_count), b.phone, b.address, b.social_security,
                b.disability_status, b.disability_rate || null, JSON.stringify(req.body.central_assistance || []),
                b.household_description, parseFloatSafe(b.household_income), parseFloatSafe(b.per_capita_income),
                req.files.profile_photo ? req.files.profile_photo[0].buffer : null,
                req.files.profile_photo ? req.files.profile_photo[0].originalname : null,
                req.files.profile_photo ? req.files.profile_photo[0].mimetype : null,
                now, now
            ]
        );
        const personId = result.rows[0].id;

        // Handle assistance records
        const types = Array.isArray(b['assistance_type[]']) ? b['assistance_type[]'] : [b['assistance_type[]']].filter(Boolean);
        const dates = Array.isArray(b['assistance_date[]']) ? b['assistance_date[]'] : [b['assistance_date[]']].filter(Boolean);
        const amounts = Array.isArray(b['assistance_amount[]']) ? b['assistance_amount[]'] : [b['assistance_amount[]']].filter(Boolean);

        for (let i = 0; i < types.length; i++) {
            if (types[i] || dates[i] || amounts[i]) {
                await client.query(
                    'INSERT INTO assistance_records (person_id, assistance_type, assistance_date, assistance_amount) VALUES ($1, $2, $3, $4)',
                    [personId, types[i], dates[i] || null, parseFloatSafe(amounts[i])]
                );
            }
        }

        // Handle household images
        if (req.files.household_images) {
            for (const file of req.files.household_images) {
                await client.query(
                    'INSERT INTO household_images (person_id, image_data, filename, mimetype, created_at) VALUES ($1, $2, $3, $4, $5)',
                    [personId, file.buffer, file.originalname, file.mimetype, now]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Success', id: personId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

const ensureArray = (val) => {
    if (val === undefined || val === null) return [];
    return Array.isArray(val) ? val : [val];
};

app.post('/api/person/:id/edit', upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'household_images' }
]), async (req, res) => {
    console.log(`[EDIT] Request received for ID: ${req.params.id}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const personId = req.params.id;
        const b = req.body;
        console.log('[EDIT] Body parsed. Processing...');

        const now = new Date().toISOString();
        const centralAssistance = ensureArray(b.central_assistance);

        await client.query(
            `UPDATE persons
        SET file_no = $1, full_name = $2, national_id = $3, birth_date = $4, spouse_name = $5,
            household_size = $6, children_count = $7, student_count = $8,
            phone = $9, address = $10, social_security = $11, disability_status = $12,
            disability_rate = $13, central_assistance = $14, household_description = $15,
            household_income = $16, per_capita_income = $17, updated_at = $18
        WHERE id = $19`,
            [
                b.file_no, b.full_name, b.national_id, b.birth_date || null, b.spouse_name, parseIntSafe(b.household_size),
                parseIntSafe(b.children_count), parseIntSafe(b.student_count), b.phone, b.address, b.social_security,
                b.disability_status, b.disability_rate || null, JSON.stringify(centralAssistance),
                b.household_description, parseFloatSafe(b.household_income), parseFloatSafe(b.per_capita_income),
                now, personId
            ]
        );
        console.log('[EDIT] Main record updated.');

        if (req.files && req.files.profile_photo) {
            const f = req.files.profile_photo[0];
            await client.query(
                'UPDATE persons SET profile_photo = $1, profile_photo_filename = $2, profile_photo_mimetype = $3 WHERE id = $4',
                [f.buffer, f.originalname, f.mimetype, personId]
            );
            console.log('[EDIT] Profile photo updated.');
        }

        // Deletions
        const deleteImageIds = ensureArray(b.delete_image_ids).filter(Boolean);
        if (deleteImageIds.length > 0) {
            await client.query('DELETE FROM household_images WHERE person_id = $1 AND id = ANY($2)', [personId, deleteImageIds]);
            console.log('[EDIT] Images deleted.');
        }

        // Assistance Records Replacement
        await client.query('DELETE FROM assistance_records WHERE person_id = $1', [personId]);

        const types = ensureArray(b['assistance_type[]']);
        const dates = ensureArray(b['assistance_date[]']);
        const amounts = ensureArray(b['assistance_amount[]']);

        for (let i = 0; i < types.length; i++) {
            if (types[i] || dates[i] || amounts[i]) {
                await client.query(
                    'INSERT INTO assistance_records (person_id, assistance_type, assistance_date, assistance_amount) VALUES ($1, $2, $3, $4)',
                    [personId, types[i], dates[i] || null, parseFloatSafe(amounts[i])]
                );
            }
        }
        console.log('[EDIT] Assistance records updated.');

        // New Images
        if (req.files && req.files.household_images) {
            for (const file of req.files.household_images) {
                await client.query(
                    'INSERT INTO household_images (person_id, image_data, filename, mimetype, created_at) VALUES ($1, $2, $3, $4, $5)',
                    [personId, file.buffer, file.originalname, file.mimetype, now]
                );
            }
            console.log('[EDIT] New images inserted.');
        }

        await client.query('COMMIT');
        console.log('[EDIT] Transaction committed.');
        res.json({ message: 'Success', id: personId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[EDIT] ERROR:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.delete('/api/person/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const personId = req.params.id;

        // Delete related records first (cascade manually)
        await client.query('DELETE FROM agenda_items WHERE person_id = $1', [personId]);
        await client.query('DELETE FROM assistance_records WHERE person_id = $1', [personId]);
        await client.query('DELETE FROM household_images WHERE person_id = $1', [personId]);

        // Delete the person
        await client.query('DELETE FROM persons WHERE id = $1', [personId]);

        await client.query('COMMIT');
        res.json({ message: 'Deleted' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Photo APIs
app.get('/api/person/:id/profile_photo', async (req, res) => {
    try {
        const result = await pool.query('SELECT profile_photo, profile_photo_mimetype FROM persons WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0 || !result.rows[0].profile_photo) return res.status(404).end();
        res.setHeader('Content-Type', result.rows[0].profile_photo_mimetype || 'image/jpeg');
        res.send(result.rows[0].profile_photo);
    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
});

app.get('/api/household_image/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT image_data, mimetype FROM household_images WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).end();
        res.setHeader('Content-Type', result.rows[0].mimetype || 'image/jpeg');
        res.send(result.rows[0].image_data);
    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
});

// Agendas API
app.get('/api/agendas', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT a.*, COUNT(ai.id) AS item_count
      FROM agendas a
      LEFT JOIN agenda_items ai ON ai.agenda_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
        res.json({ agendas: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agenda/new', async (req, res) => {
    try {
        const { title, meeting_date, description } = req.body;
        const now = new Date().toISOString();
        const result = await pool.query(
            'INSERT INTO agendas (title, meeting_date, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [title, meeting_date || null, description || null, now, now]
        );
        res.status(201).json({ message: 'Created', id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/agenda/:id', async (req, res) => {
    try {
        const agendaResult = await pool.query('SELECT * FROM agendas WHERE id = $1', [req.params.id]);
        if (agendaResult.rows.length === 0) return res.status(404).json({ error: 'Agenda not found' });

        const itemsResult = await pool.query(`
      SELECT ai.id, ai.agenda_id, ai.application_date, ai.assistance_type,
             ai.notes, ai.created_at, p.id AS person_id, p.file_no, p.full_name,
             p.phone, p.address
      FROM agenda_items ai
      JOIN persons p ON p.id = ai.person_id
      WHERE ai.agenda_id = $1
      ORDER BY ai.created_at DESC`,
            [req.params.id]
        );

        res.json({
            ...agendaResult.rows[0],
            items: itemsResult.rows.map(item => ({
                ...item,
                person: { id: item.person_id, file_no: item.file_no, full_name: item.full_name }
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agenda/:id/update', async (req, res) => {
    try {
        const { title, meeting_date, description } = req.body;
        const now = new Date().toISOString();
        await pool.query(
            'UPDATE agendas SET title = $1, meeting_date = $2, description = $3, updated_at = $4 WHERE id = $5',
            [title, meeting_date || null, description || null, now, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agenda/:id/add_item', async (req, res) => {
    try {
        const { person_id, application_date, assistance_type, notes } = req.body;
        const now = new Date().toISOString();
        await pool.query(
            'INSERT INTO agenda_items (agenda_id, person_id, application_date, assistance_type, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.params.id, person_id, application_date || null, assistance_type, notes, now]
        );
        res.json({ message: 'Added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agenda_item/:id/update', async (req, res) => {
    try {
        const { application_date, assistance_type, notes } = req.body;
        await pool.query(
            'UPDATE agenda_items SET application_date = $1, assistance_type = $2, notes = $3 WHERE id = $4',
            [application_date || null, assistance_type, notes, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/agenda_item/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM agenda_items WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Presentation API
app.get('/api/agenda/:id/presentation', async (req, res) => {
    try {
        const agendaResult = await pool.query('SELECT * FROM agendas WHERE id = $1', [req.params.id]);
        if (agendaResult.rows.length === 0) return res.status(404).json({ error: 'Agenda not found' });

        const itemsResult = await pool.query(`
      SELECT ai.id AS agenda_item_id, ai.agenda_id, ai.application_date, ai.assistance_type, ai.notes, ai.created_at AS agenda_item_created_at,
             p.id AS person_id, p.file_no, p.full_name, p.national_id, p.birth_date, p.spouse_name,
             p.household_size, p.children_count, p.student_count, p.phone, p.address, p.social_security,
             p.disability_status, p.disability_rate, p.central_assistance, p.household_description,
             p.household_income, p.per_capita_income, p.profile_photo IS NOT NULL AS has_profile_photo
      FROM agenda_items ai
      JOIN persons p ON p.id = ai.person_id
      WHERE ai.agenda_id = $1
      ORDER BY ai.created_at`,
            [req.params.id]
        );

        const personIds = [...new Set(itemsResult.rows.map(r => r.person_id))];
        const assistanceMap = {};
        const imagesMap = {};

        if (personIds.length > 0) {
            const assistanceResult = await pool.query(`
        SELECT person_id, assistance_type, assistance_date, assistance_amount
        FROM (
          SELECT person_id, assistance_type, assistance_date, assistance_amount,
                 ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY assistance_date DESC, id DESC) as rn
          FROM assistance_records
          WHERE person_id = ANY($1)
        ) ranked
        WHERE rn <= 2`,
                [personIds]
            );
            assistanceResult.rows.forEach(r => {
                if (!assistanceMap[r.person_id]) assistanceMap[r.person_id] = [];
                assistanceMap[r.person_id].push(r);
            });

            const imagesResult = await pool.query(
                'SELECT id, person_id, filename FROM household_images WHERE person_id = ANY($1) ORDER BY person_id, id',
                [personIds]
            );
            imagesResult.rows.forEach(r => {
                if (!imagesMap[r.person_id]) imagesMap[r.person_id] = [];
                imagesMap[r.person_id].push({ id: r.id, filename: r.filename });
            });
        }

        const slides = itemsResult.rows.map(row => {
            let central_assistance = [];
            try {
                central_assistance = typeof row.central_assistance === 'string' ? JSON.parse(row.central_assistance) : (row.central_assistance || []);
            } catch (e) { console.error("JSON parse error for central_assistance", e); }

            return {
                agenda_item_id: row.agenda_item_id,
                application_date: row.application_date,
                assistance_type: row.assistance_type,
                notes: row.notes,
                person: {
                    ...row,
                    id: row.person_id,
                    age: calculateAge(row.birth_date),
                    household_description_lines: normalizeDescription(row.household_description)
                },
                central_assistance,
                assistance_records: assistanceMap[row.person_id] || [],
                household_images: imagesMap[row.person_id] || []
            };
        });

        res.json({
            agenda: agendaResult.rows[0],
            slides
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Excel Export
app.get('/api/agenda/:id/report.xlsx', async (req, res) => {
    try {
        const agendaResult = await pool.query('SELECT * FROM agendas WHERE id = $1', [req.params.id]);
        if (agendaResult.rows.length === 0) return res.status(404).end();

        const itemsResult = await pool.query(`
            SELECT p.file_no, p.full_name, ai.application_date, ai.assistance_type, ai.notes,
                   p.address, p.social_security, p.household_size, p.children_count, p.student_count,
                   p.household_income, p.per_capita_income
            FROM agenda_items ai
            JOIN persons p ON p.id = ai.person_id
            WHERE ai.agenda_id = $1
            ORDER BY ai.created_at`,
            [req.params.id]
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Gundem Raporu');

        worksheet.columns = [
            { header: 'Dosya No', key: 'file_no', width: 12 },
            { header: 'Ad Soyad', key: 'full_name', width: 25 },
            { header: 'Basvuru Tarihi', key: 'application_date', width: 15 },
            { header: 'Yardim Turu', key: 'assistance_type', width: 20 },
            { header: 'Notlar', key: 'notes', width: 30 },
            { header: 'Adres', key: 'address', width: 40 },
            { header: 'Sosyal Guvence', key: 'social_security', width: 15 },
            { header: 'Hane Nufusu', key: 'household_size', width: 12 },
            { header: 'Cocuk Sayisi', key: 'children_count', width: 12 },
            { header: 'Ogrenci Sayisi', key: 'student_count', width: 12 },
            { header: 'Hane Geliri', key: 'household_income', width: 15 },
            { header: 'Kisi Basina Gelir', key: 'per_capita_income', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };

        itemsResult.rows.forEach(row => {
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=gundem_${req.params.id}_rapor.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;

