require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3011; // ← ใช้ 3011 ตาม .env

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------- Config ----------
const TABLE_NAME = 'products_iphone'; // ตารางตามรูป

// โฟลเดอร์เก็บรูป (เปลี่ยนได้ถ้าเครื่องคุณต่างจากนี้)
const uploadDir = process.env.UPLOAD_ROOT ||
  '/var/www/html/std6630251261/Inventory/uploads/images';

// base URL สำหรับเสิร์ฟไฟล์รูป (ใช้กับ client)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ||
  'http://nindam.sytes.net/std6630251261/Inventory';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads/images', express.static(uploadDir));

// ---------- DB Pool ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

pool.getConnection()
  .then((c) => { console.log('✅ DB connected'); c.release(); })
  .catch((e) => console.error('❌ DB connect error:', e.message, e.code));

// ---------- Multer ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${uuidv4()}.${ext}`);
  },
});
const upload = multer({ storage });

// ---------- Routes ----------
app.get('/api', (req, res) => res.json({ message: 'API is running...' }));

// GET all
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT \`id\`, \`name\`, \`price\`, \`image\`
       FROM \`${TABLE_NAME}\`
       ORDER BY \`id\` DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /products error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET by id
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT \`id\`, \`name\`, \`price\`, \`image\`
       FROM \`${TABLE_NAME}\`
       WHERE \`id\` = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('GET /products/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST create (multipart/form-data, field ชื่อ "image")
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const priceNum = (price !== undefined && price !== '') ? Number(price) : null;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `${PUBLIC_BASE_URL}/uploads/images/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO \`${TABLE_NAME}\` (\`name\`, \`price\`, \`image\`)
       VALUES (?, ?, ?)`,
      [name, priceNum, imageUrl]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      name,
      price: priceNum,
      image: imageUrl,
    });
  } catch (e) {
    console.error('POST /products error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT update
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      `SELECT \`id\`, \`name\`, \`price\`, \`image\`
       FROM \`${TABLE_NAME}\`
       WHERE \`id\` = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const old = rows[0];
    const name = (req.body.name !== undefined) ? req.body.name : old.name;
    const price = (req.body.price !== undefined && req.body.price !== '')
      ? Number(req.body.price) : old.price;

    let newImageUrl = old.image;
    if (req.file) {
      newImageUrl = `${PUBLIC_BASE_URL}/uploads/images/${req.file.filename}`;
      if (old.image) {
        const oldFileName = old.image.split('/').pop();
        const oldPath = path.join(uploadDir, oldFileName);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await pool.query(
      `UPDATE \`${TABLE_NAME}\`
       SET \`name\`=?, \`price\`=?, \`image\`=?
       WHERE \`id\`=?`,
      [name, price, newImageUrl, id]
    );

    res.json({ success: true, id, name, price, image: newImageUrl });
  } catch (e) {
    console.error('PUT /products/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      `SELECT \`image\` FROM \`${TABLE_NAME}\` WHERE \`id\`=?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const imgUrl = rows[0].image;
    if (imgUrl) {
      const fileName = imgUrl.split('/').pop();
      const imagePath = path.join(uploadDir, fileName);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    const [result] = await pool.query(
      `DELETE FROM \`${TABLE_NAME}\` WHERE \`id\`=?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (e) {
    console.error('DELETE /products/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Start ----------
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
