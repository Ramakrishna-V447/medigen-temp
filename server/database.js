
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Create a database file named 'medigen.db'
const dbPath = path.resolve(__dirname, 'medigen.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            password TEXT,
            role TEXT,
            created_at INTEGER,
            otp TEXT,
            otp_expires INTEGER
        )`, (err) => {
            if (!err) {
                // Attempt to add columns if table existed but columns didn't (Migration fix)
                db.run("ALTER TABLE users ADD COLUMN otp TEXT", () => {});
                db.run("ALTER TABLE users ADD COLUMN otp_expires INTEGER", () => {});
            }
        });

        // Create Admin Notifications Table
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT, 
            message TEXT,
            user_email TEXT,
            ip_address TEXT,
            created_at INTEGER,
            read INTEGER DEFAULT 0
        )`);

        // Seed Admin User
        const adminEmail = 'admin@medigen.com';
        db.get("SELECT email FROM users WHERE email = ?", [adminEmail], (err, row) => {
            if (!row) {
                // Hash the default admin password
                const salt = bcrypt.genSaltSync(10);
                const hashedPassword = bcrypt.hashSync('admin', salt);

                const adminUser = {
                    id: 'usr_admin',
                    name: 'Super Admin',
                    email: adminEmail,
                    phone: '+91 98765 43210',
                    password: hashedPassword, 
                    role: 'admin',
                    created_at: Date.now()
                };
                
                const insert = db.prepare("INSERT INTO users (id, name, email, phone, password, role, created_at) VALUES (?,?,?,?,?,?,?)");
                insert.run(adminUser.id, adminUser.name, adminUser.email, adminUser.phone, adminUser.password, adminUser.role, adminUser.created_at);
                insert.finalize();
                console.log("Seeded Admin User with Secure Password");
            }
        });
    });
}

module.exports = db;
