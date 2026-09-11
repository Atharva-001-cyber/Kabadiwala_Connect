import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/api.router';
import { db } from './db/store';
import { isSupabaseConfigured } from './db/supabase';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    database: isSupabaseConfigured() ? 'SUPABASE_CLOUD_CONNECTED' : 'LOCAL_JSON_FALLBACK',
    project: 'Kabadiwala Connect (SIH 2026 #229)',
    timestamp: new Date().toISOString(),
    stats: {
      lots: db.lots.length,
      collectors: db.collectors.length,
      recyclers: db.recyclers.length
    }
  });
});

// Mount main API
app.use('/api', apiRouter);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Kabadiwala Connect Backend API running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Base API: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
