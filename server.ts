import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

let db: Database.Database;

async function startServer() {
  console.log("Starting server...");
  try {
    db = new Database("catalog.db", { verbose: console.log });
    console.log("Database initialized.");
    
    // Initialize Database
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        stock INTEGER DEFAULT 0,
        description TEXT,
        category_id INTEGER,
        image TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        subtitle TEXT,
        image TEXT,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Migration: Add stock column if not exists
    const tableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
    const hasStock = tableInfo.some(col => col.name === "stock");
    if (!hasStock) {
      db.exec("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0");
    }

    // Seed Admin User if not exists
    const newAdminEmail = "cleverbb8@gmail.com";
    const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get(newAdminEmail);
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync("Jr07032019##", 10);
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(newAdminEmail, hashedPassword);
      
      // Remove old default admin if it exists
      db.prepare("DELETE FROM users WHERE username = ?").run("admin");
    }

    // Seed initial settings if empty
    const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as any;
    const initialSettings = {
      storeName: "MIZUBELEM - Filial Portel",
      primaryColor: "#0ea5e9", // Sky Blue (Azul Claro)
      layoutMode: "grid",
      fontFamily: "Inter"
    };

    if (settingsCount.count === 0) {
      const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
      for (const [key, value] of Object.entries(initialSettings)) {
        insertSetting.run(key, value);
      }
    } else {
      // Force update if it's still the old default "Minha Loja"
      const currentName = db.prepare("SELECT value FROM settings WHERE key = ?").get("storeName") as any;
      if (currentName?.value === "Minha Loja" || currentName?.value === "Catálogo Online Pro") {
        const updateSetting = db.prepare("UPDATE settings SET value = ? WHERE key = ?");
        updateSetting.run(initialSettings.storeName, "storeName");
        updateSetting.run(initialSettings.primaryColor, "primaryColor");
      }
    }
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }

  const app = express();
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Configure Multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // Serve uploads statically
  app.use("/uploads", express.static(uploadsDir));

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    console.log("Login attempt:", req.body.username);
    try {
      const { username, password } = req.body;
      const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
        res.json({ token });
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Product Routes
  app.get("/api/products", (req, res) => {
    console.log("Fetching products...");
    try {
      const products = db.prepare(`
        SELECT p.*, c.name as category 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `).all();
      res.json(products);
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/products", authenticateToken, (req, res) => {
    const { name, price, stock, description, category_id, image } = req.body;
    const result = db.prepare("INSERT INTO products (name, price, stock, description, category_id, image) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, price, stock || 0, description, category_id, image);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/products/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, price, stock, description, category_id, image } = req.body;
    db.prepare("UPDATE products SET name = ?, price = ?, stock = ?, description = ?, category_id = ?, image = ? WHERE id = ?")
      .run(name, price, stock || 0, description, category_id, image, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Category Routes
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", authenticateToken, (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: "Categoria já existe ou nome inválido" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    // Check if products are using this category
    const productsUsing = db.prepare("SELECT COUNT(*) as count FROM products WHERE category_id = ?").get(id) as any;
    if (productsUsing.count > 0) {
      return res.status(400).json({ error: "Não é possível excluir uma categoria que possui produtos associados." });
    }
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Banner Routes
  app.get("/api/banners", (req, res) => {
    const banners = db.prepare("SELECT * FROM banners WHERE active = 1").all();
    res.json(banners);
  });

  app.get("/api/admin/banners", authenticateToken, (req, res) => {
    const banners = db.prepare("SELECT * FROM banners").all();
    res.json(banners);
  });

  app.post("/api/banners", authenticateToken, (req, res) => {
    const { title, subtitle, image } = req.body;
    const result = db.prepare("INSERT INTO banners (title, subtitle, image) VALUES (?, ?, ?)")
      .run(title, subtitle, image);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/banners/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, subtitle, image, active } = req.body;
    db.prepare("UPDATE banners SET title = ?, subtitle = ?, image = ?, active = ? WHERE id = ?")
      .run(title, subtitle, image, active ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/banners/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM banners WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Settings Routes
  app.get("/api/stats", authenticateToken, (req, res) => {
    try {
      const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
      const totalCategories = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;
      const avgPrice = db.prepare("SELECT AVG(price) as avg FROM products").get() as any;
      const stockValue = db.prepare("SELECT SUM(price * stock) as total FROM products").get() as any;
      
      const categoryStats = db.prepare(`
        SELECT c.name, COUNT(p.id) as count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
        GROUP BY c.id
      `).all();

      res.json({
        totalProducts: totalProducts.count,
        totalCategories: totalCategories.count,
        avgPrice: avgPrice.avg || 0,
        stockValue: stockValue.total || 0,
        categoryStats
      });
    } catch (err) {
      res.status(500).json({ error: "Error fetching stats" });
    }
  });

  app.get("/api/settings", (req, res) => {
    console.log("Fetching settings...");
    try {
      const rows = db.prepare("SELECT * FROM settings").all();
      const settings: any = {};
      rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });
      res.json(settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/settings", authenticateToken, (req, res) => {
    const settings = req.body;
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, value);
      }
    });
    transaction(settings);
    res.json({ success: true });
  });

  // Upload Route
  app.post("/api/upload", authenticateToken, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // Download Route
  app.get("/api/download/:filename", authenticateToken, (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(uploadsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
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

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
