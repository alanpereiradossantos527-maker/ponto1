import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ponto.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    hourly_rate REAL DEFAULT 25.0,
    profession TEXT
  );

  CREATE TABLE IF NOT EXISTS workplaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS point_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workplace_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('in', 'out')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    latitude REAL,
    longitude REAL,
    photo_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(workplace_id) REFERENCES workplaces(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('manager_password', '1234');
`);

// Migration: Add profession column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN profession TEXT").run();
} catch (e) {
  // Column already exists or other error
}

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, role, hourly_rate) VALUES (?, ?, ?)").run("João Silva", "employee", 30.0);
  db.prepare("INSERT INTO users (name, role, hourly_rate) VALUES (?, ?, ?)").run("Admin Gestor", "manager", 0);
  
  db.prepare("INSERT INTO workplaces (name, latitude, longitude, radius_meters) VALUES (?, ?, ?, ?)").run(
    "Escritório Central", 
    -23.5505, 
    -46.6333, 
    150
  );
  db.prepare("INSERT INTO workplaces (name, latitude, longitude, radius_meters) VALUES (?, ?, ?, ?)").run(
    "Obra Alpha", 
    -23.5520, 
    -46.6350, 
    200
  );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  const PORT = 3000;

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    try {
      const { name, hourlyRate, profession, photo } = req.body;
      if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

      const existing = db.prepare("SELECT id FROM users WHERE name = ?").get(name);
      if (existing) return res.status(400).json({ error: "Este nome já está cadastrado" });
      
      const rate = hourlyRate || 30.0; // Default rate if not provided
      const result = db.prepare("INSERT INTO users (name, role, hourly_rate, profession) VALUES (?, ?, ?, ?)").run(name, 'employee', rate, profession);
      const userId = result.lastInsertRowid;
      
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro interno ao cadastrar" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { name, photo } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "Usuário não encontrado" });
    }
  });

  app.get("/api/workplaces", (req, res) => {
    const workplaces = db.prepare("SELECT * FROM workplaces").all();
    res.json(workplaces);
  });

  app.get("/api/user/:id/stats", (req, res) => {
    const userId = req.params.id;
    const logs = db.prepare(`
      SELECT * FROM point_logs 
      WHERE user_id = ? 
      ORDER BY timestamp ASC
    `).all(userId) as any[];
    
    const user = db.prepare("SELECT hourly_rate FROM users WHERE id = ?").get(userId) as { hourly_rate: number };
    const hourlyRate = user?.hourly_rate || 25.0;

    let totalEarnings = 0;
    let lastIn: number | null = null;

    logs.forEach(log => {
      const time = new Date(log.timestamp).getTime();
      if (log.type === 'in') {
        lastIn = time;
      } else if (log.type === 'out' && lastIn !== null) {
        const durationHours = (time - lastIn) / (1000 * 60 * 60);
        totalEarnings += durationHours * hourlyRate;
        lastIn = null;
      }
    });

    res.json({ 
      logs: [...logs].reverse(), // Return reversed for UI display
      earnings: parseFloat(totalEarnings.toFixed(2)) 
    });
  });

  app.post("/api/point/register", (req, res) => {
    const { userId, workplaceId, type, latitude, longitude, photo } = req.body;
    
    // In a real app, we'd verify geofencing on the server too
    // For this prototype, we'll trust the client validation but store the data
    
    const stmt = db.prepare(`
      INSERT INTO point_logs (user_id, workplace_id, type, latitude, longitude, photo_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(userId, workplaceId, type, latitude, longitude, photo);
    
    res.json({ success: true, timestamp: new Date().toISOString() });
  });

  app.get("/api/manager/export-afd", (req, res) => {
    const logs = db.prepare(`
      SELECT p.*, u.name as user_name
      FROM point_logs p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.timestamp ASC
    `).all() as any[];

    // Simple AFD-like text format for demonstration
    let content = "REGISTRO AFD - PONTO INTELIGENTE\n";
    content += "GERADO EM: " + new Date().toISOString() + "\n";
    content += "------------------------------------------\n";
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
      const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
      content += `${log.id.toString().padStart(10, '0')} | ${log.user_name.padEnd(20)} | ${date} | ${time} | ${log.type.toUpperCase()}\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=export_afd.txt');
    res.send(content);
  });

  app.get("/api/manager/export-afd/:userId", (req, res) => {
    const { userId } = req.params;
    const user = db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).send("Usuário não encontrado");

    const logs = db.prepare(`
      SELECT p.*, u.name as user_name
      FROM point_logs p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.timestamp ASC
    `).all(userId) as any[];

    let content = `REGISTRO AFD INDIVIDUAL - ${user.name.toUpperCase()}\n`;
    content += "GERADO EM: " + new Date().toISOString() + "\n";
    content += "------------------------------------------\n";
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
      const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
      content += `${log.id.toString().padStart(10, '0')} | ${date} | ${time} | ${log.type.toUpperCase()}\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=afd_${user.name.replace(/\s+/g, '_').toLowerCase()}.txt`);
    res.send(content);
  });

  app.get("/api/manager/users", (req, res) => {
    const users = db.prepare(`
      SELECT 
        u.id, u.name, u.role, u.hourly_rate,
        (
          SELECT SUM(
            CASE 
              WHEN p2.type = 'out' THEN (julianday(p2.timestamp) - julianday(p1.timestamp)) * 24 * u.hourly_rate
              ELSE 0 
            END
          )
          FROM point_logs p1
          JOIN point_logs p2 ON p1.user_id = p2.user_id 
            AND p2.timestamp > p1.timestamp 
            AND p2.type = 'out' 
            AND p1.type = 'in'
            AND date(p1.timestamp) = date('now')
            AND NOT EXISTS (
              SELECT 1 FROM point_logs p3 
              WHERE p3.user_id = p1.user_id 
              AND p3.timestamp > p1.timestamp 
              AND p3.timestamp < p2.timestamp
            )
          WHERE p1.user_id = u.id
        ) as earnings_today
      FROM users u 
      WHERE u.role = 'employee'
    `).all();
    res.json(users);
  });

  app.post("/api/manager/user/update-rate", (req, res) => {
    const { userId, hourlyRate } = req.body;
    db.prepare("UPDATE users SET hourly_rate = ? WHERE id = ?").run(hourlyRate, userId);
    res.json({ success: true });
  });

  app.delete("/api/manager/user/:id", (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: "ID inválido" });
      }

      // Delete logs first
      db.prepare("DELETE FROM point_logs WHERE user_id = ?").run(userId);
      // Then delete user
      const result = db.prepare("DELETE FROM users WHERE id = ?").run(userId);
      
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: "Usuário não encontrado" });
      }
    } catch (err: any) {
      console.error("Erro ao deletar usuário:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/manager/verify-password", (req, res) => {
    const { password } = req.body;
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'manager_password'").get() as { value: string };
    if (setting.value === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Senha incorreta" });
    }
  });

  app.post("/api/manager/update-password", (req, res) => {
    const { newPassword } = req.body;
    db.prepare("UPDATE settings SET value = ? WHERE key = 'manager_password'").run(newPassword);
    res.json({ success: true });
  });

  app.delete("/api/manager/log/:id", (req, res) => {
    try {
      const { id } = req.params;
      const logId = parseInt(id);
      if (isNaN(logId)) return res.status(400).json({ success: false, error: "ID inválido" });
      
      const result = db.prepare("DELETE FROM point_logs WHERE id = ?").run(logId);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: "Registro não encontrado" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/manager/dashboard", (req, res) => {
    const activePoints = db.prepare(`
      SELECT p.*, u.name as user_name, u.profession as user_profession, w.name as workplace_name
      FROM point_logs p
      JOIN users u ON p.user_id = u.id
      JOIN workplaces w ON p.workplace_id = w.id
      ORDER BY p.timestamp DESC
      LIMIT 50
    `).all();

    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(DISTINCT user_id) FROM point_logs WHERE date(timestamp) = date('now')) as active_today,
        (SELECT COUNT(*) FROM point_logs WHERE date(timestamp) = date('now')) as total_logs,
        (
          SELECT SUM(
            CASE 
              WHEN p2.type = 'out' THEN (julianday(p2.timestamp) - julianday(p1.timestamp)) * 24 * u.hourly_rate
              ELSE 0 
            END
          )
          FROM point_logs p1
          JOIN point_logs p2 ON p1.user_id = p2.user_id 
            AND p2.timestamp > p1.timestamp 
            AND p2.type = 'out' 
            AND p1.type = 'in'
            AND date(p1.timestamp) = date('now')
            AND NOT EXISTS (
              SELECT 1 FROM point_logs p3 
              WHERE p3.user_id = p1.user_id 
              AND p3.timestamp > p1.timestamp 
              AND p3.timestamp < p2.timestamp
            )
          JOIN users u ON p1.user_id = u.id
        ) as total_earnings_today
    `).get() as any;
    
    res.json({ logs: activePoints, stats });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
