import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Serve static files from the uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // --- API ROUTES ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { staffId, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE staffId = ?').get(staffId) as any;
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: user.id, staffId: user.staffId, name: user.name, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Middleware to verify token
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Get current user
  app.get('/api/auth/me', authenticate, (req: any, res: any) => {
    try {
      const user = db.prepare('SELECT id, staffId, name, role FROM users WHERE id = ?').get(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Users API (Admin only)
  app.get('/api/users', authenticate, (req: any, res: any) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') return res.status(403).json({ error: 'Forbidden' });
    const users = db.prepare('SELECT id, staffId, name, role FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticate, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const { staffId, name, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (staffId, name, password, role) VALUES (?, ?, ?, ?)').run(staffId, name, hashedPassword, role);
      res.json({ id: result.lastInsertRowid, staffId, name, role });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', authenticate, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Tasks API
  app.get('/api/tasks', authenticate, (req: any, res: any) => {
    let tasks;
    if (req.user.role === 'Staff') {
      tasks = db.prepare(`
        SELECT tasks.*, users.name as staffName, users.staffId as staffIdStr 
        FROM tasks 
        JOIN users ON tasks.assignedTo = users.id 
        WHERE assignedTo = ?
      `).all(req.user.id);
    } else {
      tasks = db.prepare(`
        SELECT tasks.*, users.name as staffName, users.staffId as staffIdStr 
        FROM tasks 
        JOIN users ON tasks.assignedTo = users.id
      `).all();
    }
    res.json(tasks);
  });

  app.post('/api/tasks', authenticate, (req: any, res: any) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') return res.status(403).json({ error: 'Forbidden' });
    const { refNo, title, description, deadline, priority, assignedTo } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO tasks (refNo, title, description, deadline, priority, status, assignedTo, managerId) 
        VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)
      `).run(refNo, title, description, deadline, priority, assignedTo, req.user.id);
      
      // Notify staff
      db.prepare('INSERT INTO notifications (userId, message, createdAt) VALUES (?, ?, ?)').run(
        assignedTo, 
        `New task assigned: ${title} (${refNo})`, 
        new Date().toISOString()
      );

      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/tasks/:id', authenticate, (req: any, res: any) => {
    const { status, staffNotes, managerNotes, fileUrl } = req.body;
    const taskId = req.params.id;
    
    try {
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
      if (!task) return res.status(404).json({ error: 'Task not found' });

      if (req.user.role === 'Staff' && task.assignedTo !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (status) { updates.push('status = ?'); values.push(status); }
      if (staffNotes !== undefined) { updates.push('staffNotes = ?'); values.push(staffNotes); }
      if (managerNotes !== undefined) { updates.push('managerNotes = ?'); values.push(managerNotes); }
      if (fileUrl !== undefined) { updates.push('fileUrl = ?'); values.push(fileUrl); }

      if (updates.length > 0) {
        values.push(taskId);
        db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        
        // Notifications
        if (req.user.role === 'Staff' && status === 'Completed') {
          db.prepare('INSERT INTO notifications (userId, message, createdAt) VALUES (?, ?, ?)').run(
            task.managerId, 
            `Task ${task.refNo} submitted by Staff`, 
            new Date().toISOString()
          );
        } else if ((req.user.role === 'Manager' || req.user.role === 'Admin') && status === 'Needs Resubmission') {
          db.prepare('INSERT INTO notifications (userId, message, createdAt) VALUES (?, ?, ?)').run(
            task.assignedTo, 
            `Task ${task.refNo} needs resubmission`, 
            new Date().toISOString()
          );
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Notifications API
  app.get('/api/notifications', authenticate, (req: any, res: any) => {
    const notifications = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
    res.json(notifications);
  });

  app.put('/api/notifications/:id/read', authenticate, (req: any, res: any) => {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // File Upload API
  app.post('/api/upload', upload.single('file'), (req: any, res: any) => {
    console.log('--- Upload Request Received ---');
    console.log('Headers:', req.headers);
    
    if (!req.file) {
      console.error('Upload Error: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);
    
    // Return the relative URL to the file
    try {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      console.log('Generated File URL:', fileUrl);
      res.json({ url: fileUrl });
    } catch (err: any) {
      console.error('Error generating file URL:', err);
      res.status(500).json({ error: 'Internal server error during URL generation' });
    }
  });

  // Global Error Handler (Add this BEFORE app.listen but AFTER all routes)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('--- Global Server Error ---');
    console.error(err);
    
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer Error: ${err.message}` });
    }
    
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err : undefined
    });
  });

  // Seed initial admin if not exists
  const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('Admin');
  if (!adminExists) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (staffId, name, password, role) VALUES (?, ?, ?, ?)').run('ADMIN001', 'System Admin', hashed, 'Admin');
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
