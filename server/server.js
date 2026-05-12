
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // Requires npm install nodemailer
const db = require('./database');

const app = express();
const PORT = 5000;
const ADMIN_EMAIL = 'admin@medigen.com';

app.use(cors());
app.use(bodyParser.json());

// --- SMTP CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com', 
        pass: process.env.SMTP_PASS || 'your-app-password' 
    }
});

// --- Helper Functions ---

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

const getIp = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
};

const sendEmail = async (to, subject, html) => {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    try {
        if (process.env.SMTP_USER) {
            await transporter.sendMail({
                from: '"MediGen System" <no-reply@medigen.com>',
                to,
                subject,
                html
            });
        }
    } catch (e) {
        console.error("Failed to send real email (Check SMTP config):", e.message);
    }
};

const logNotification = (type, message, userEmail, ip) => {
    const sql = `INSERT INTO notifications (type, message, user_email, ip_address, created_at) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [type, message, userEmail, ip, Date.now()], (err) => {
        if (err) console.error("Failed to log notification", err);
    });
};

// --- Auth Routes ---

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    const ip = getIp(req);
    
    if (!name || !email || !password || !phone) return res.status(400).json({ error: "All fields are required" });
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format." });
    if (email.toLowerCase() === ADMIN_EMAIL) return res.status(403).json({ error: "Restricted email address." });
    if (!validatePassword(password)) return res.status(400).json({ error: "Weak password." });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const id = `usr_${Date.now()}`;
        const role = 'user';
        const createdAt = Date.now();

        const sql = `INSERT INTO users (id, name, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [id, name, email, phone, hashedPassword, role, createdAt], async function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: "User already exists." });
                return res.status(500).json({ error: err.message });
            }

            // 1. Send Welcome Email to User
            await sendEmail(email, "Welcome to MediGen!", `
                <h1>Welcome, ${name}!</h1>
                <p>Thank you for registering with MediGen.</p>
                <p>You can now browse and compare affordable generic medicines.</p>
            `);

            // 2. Alert Admin (Notification Panel)
            logNotification('registration', `New User Registered: ${name}`, email, ip);

            res.json({ id, name, email, phone, role, createdAt });
        });
    } catch (err) {
        res.status(500).json({ error: "Server error." });
    }
});

// Password Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const ip = getIp(req);

    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Invalid credentials." });

        const isMatch = await bcrypt.compare(password, row.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials." });

        // 1. Alert Admin via Email (User Login)
        if (row.role !== 'admin') {
            await sendEmail(ADMIN_EMAIL, `Alert: User Login - ${row.name}`, `
                <h3>User Login Detected</h3>
                <p><strong>User:</strong> ${row.name} (${row.email})</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${ip}</p>
            `);
            
            // 2. Log Real-time Notification
            logNotification('login', `User Login: ${row.name}`, email, ip);
        }

        const { password: _, otp, otp_expires, ...user } = row;
        res.json(user);
    });
});

// --- OTP Routes ---

// Send OTP
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(404).json({ error: "User not found." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000;

        db.run("UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?", [otp, expires, email], async (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to save OTP" });

            // Send Email/SMS
            await sendEmail(email, "MediGen Login OTP", `<h1>${otp}</h1><p>Valid for 10 mins.</p>`);
            console.log(`[OTP] Sent ${otp} to ${email}`);

            res.json({ success: true, message: "OTP sent." });
        });
    });
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const ip = getIp(req);

    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (Date.now() > user.otp_expires) return res.status(400).json({ error: "OTP expired" });

        db.run("UPDATE users SET otp = NULL, otp_expires = NULL WHERE email = ?", [email]);

        // Alert Admin
        if (user.role !== 'admin') {
            await sendEmail(ADMIN_EMAIL, `Alert: OTP Login - ${user.name}`, `User ${user.email} logged in via OTP from IP ${ip}`);
            logNotification('login', `OTP Login: ${user.name}`, email, ip);
        }

        const { password, otp: _, otp_expires, ...userReturn } = user;
        res.json(userReturn);
    });
});

// --- Admin Notification Route ---
app.get('/api/admin/notifications', (req, res) => {
    // In a real app, verify admin token here
    db.all("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
