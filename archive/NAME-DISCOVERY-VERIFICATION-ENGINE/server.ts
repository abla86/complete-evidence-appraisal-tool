import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as db from './server/db/database.js';
import {
  executeDeepVerification,
  executeProjectWorkflow,
  executeRecheck,
  screenCandidate,
  assembleDossier,
} from './server/engine/workflow.js';
import {
  apiRateLimiter,
  formatSafeError,
  validateCandidateName,
} from './server/security/index.js';
import { CandidateName, NamingBrief } from './src/types/index.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 2. Request body parsing with strict size limits
  app.use(express.json({ limit: '512kb' }));

  // 3. Rate limiting middleware for API routes
  app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const check = apiRateLimiter.check(ip);
    if (!check.allowed) {
      res.status(429).json({
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
        resetMs: check.resetMs,
      });
      return;
    }
    next();
  });

  // ========================================================
  // API ROUTES
  // ========================================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      engine: 'NavneKlar - Discovery & Clearance Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // List all projects
  app.get('/api/projects', (req: Request, res: Response) => {
    try {
      const projects = db.listProjects();
      res.json(projects);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Create project brief
  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<NamingBrief>;
      if (!body.title || typeof body.title !== 'string') {
        res.status(400).json({ error: 'Project title is required' });
        return;
      }

      const brief: NamingBrief = {
        title: body.title.trim(),
        entityType: body.entityType || 'company',
        description: body.description?.trim() || '',
        industry: body.industry?.trim() || 'Technology',
        targetAudience: body.targetAudience?.trim() || 'General Public',
        market: body.market || 'Global',
        languages: Array.isArray(body.languages) ? body.languages : ['en'],
        desiredTone: body.desiredTone || 'minimal',
        desiredLength: body.desiredLength || 'any',
        pronunciationPreference: body.pronunciationPreference || 'easy',
        wordType: body.wordType || 'any',
        wordsToInclude: Array.isArray(body.wordsToInclude) ? body.wordsToInclude : [],
        wordsToAvoid: Array.isArray(body.wordsToAvoid) ? body.wordsToAvoid : [],
        lettersToAvoid: Array.isArray(body.lettersToAvoid) ? body.lettersToAvoid : [],
        conceptsToCommunicate: Array.isArray(body.conceptsToCommunicate) ? body.conceptsToCommunicate : [],
      };

      const created = db.createProject(brief);
      db.logAuditEvent('PROJECT_CREATED', 'user', { projectId: created.id, title: created.title });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get project by ID
  app.get('/api/projects/:id', (req: Request, res: Response) => {
    try {
      const project = db.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Delete project by ID
  app.delete('/api/projects/:id', (req: Request, res: Response) => {
    try {
      const success = db.deleteProject(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      db.logAuditEvent('PROJECT_DELETED', 'user', { projectId: req.params.id });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Run generation & verification pipeline for project
  app.post('/api/projects/:id/generate', async (req: Request, res: Response) => {
    try {
      const project = db.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const shortlist = await executeProjectWorkflow(project, 10);
      res.json(shortlist);
    } catch (err) {
      console.error('Generation pipeline error:', err);
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get candidates for project
  app.get('/api/projects/:id/candidates', (req: Request, res: Response) => {
    try {
      const candidates = db.listCandidatesByProject(req.params.id);
      res.json(candidates);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get single candidate
  app.get('/api/candidates/:id', (req: Request, res: Response) => {
    try {
      const candidate = db.getCandidate(req.params.id);
      if (!candidate) {
        res.status(404).json({ error: 'Candidate not found' });
        return;
      }
      res.json(candidate);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Deep verify candidate
  app.post('/api/candidates/:id/deep-verify', async (req: Request, res: Response) => {
    try {
      const dossier = await executeDeepVerification(req.params.id);
      res.json(dossier);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Fresh recheck candidate (bypassing cache)
  app.post('/api/candidates/:id/recheck', async (req: Request, res: Response) => {
    try {
      const dossier = await executeRecheck(req.params.id);
      res.json(dossier);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Toggle watch status
  app.post('/api/candidates/:id/watch', (req: Request, res: Response) => {
    try {
      const isWatched = db.toggleWatchCandidate(req.params.id);
      res.json({ id: req.params.id, isWatched });
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get all watched candidates
  app.get('/api/watchlist', (req: Request, res: Response) => {
    try {
      const watchlist = db.getWatchlist();
      res.json(watchlist);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get full evidence dossier for candidate
  app.get('/api/candidates/:id/dossier', (req: Request, res: Response) => {
    try {
      const dossier = assembleDossier(req.params.id);
      res.json(dossier);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get markdown report for candidate
  app.get('/api/candidates/:id/report', (req: Request, res: Response) => {
    try {
      const report = db.getVerificationReport(req.params.id);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.json({ reportMarkdown: report });
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Instant interactive single-name check
  app.post('/api/instant-check', async (req: Request, res: Response) => {
    try {
      const { name, market, industry } = req.body as { name: string; market?: string; industry?: string };
      const validation = validateCandidateName(name);

      if (!validation.isValid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const now = new Date().toISOString();
      const tempId = `instant_${Date.now()}`;

      // Ensure default project exists for ad-hoc checks
      let defaultProj = db.getProject('instant_checks');
      if (!defaultProj) {
        defaultProj = db.createProject({
          id: 'instant_checks',
          title: 'Ad-hoc Verification Inquiries',
          entityType: 'brand',
          description: 'Single-name instant screening inquiries',
          industry: industry || 'Technology',
          targetAudience: 'Global',
          market: (market as NamingBrief['market']) || 'Global',
          languages: ['en'],
          desiredTone: 'minimal',
          desiredLength: 'any',
          pronunciationPreference: 'clear',
          wordType: 'any',
          wordsToInclude: [],
          wordsToAvoid: [],
          lettersToAvoid: [],
          conceptsToCommunicate: [],
        });
      }

      const candidateObj: CandidateName = {
        id: tempId,
        projectId: defaultProj.id || 'instant_checks',
        name: validation.sanitized,
        normalizedName: validation.sanitized.toLowerCase(),
        pronunciation: validation.sanitized.toLowerCase(),
        concept: 'User-provided ad-hoc query for instant conflict verification',
        namingStrategy: 'direct inquiry',
        whyFits: 'Direct user submission for multi-source conflict verification.',
        riskLevel: 'YELLOW',
        riskScore: 50.0,
        riskSummary: 'Instant screening in progress',
        isWatched: false,
        searchStatus: 'pending',
        verificationTimestamp: now,
        createdAt: now,
      };

      db.insertCandidate(candidateObj);

      await screenCandidate(candidateObj, {
        market: market || 'Global',
        industry: industry || 'Technology',
        deep: true,
      });

      const dossier = assembleDossier(tempId);
      res.json(dossier);
    } catch (err) {
      console.error('Instant check failure:', err);
      res.status(500).json(formatSafeError(err));
    }
  });

  // Get audit logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    try {
      const logs = db.getAuditLogs(100);
      res.json(logs);
    } catch (err) {
      res.status(500).json(formatSafeError(err));
    }
  });

  // Seed a starter project if database is empty
  const existingProjects = db.listProjects();
  if (existingProjects.length === 0) {
    const defaultBrief = db.createProject({
      id: 'proj_nordic_saas',
      title: 'Nordic Cloud Analytics Platform',
      entityType: 'platform',
      description: 'High-performance privacy-first real-time telemetry and data analytics platform tailored for European enterprises.',
      industry: 'Enterprise Software & Cloud',
      targetAudience: 'CTOs, Engineering Leaders, and Data Architects',
      market: 'Norway',
      languages: ['en', 'no'],
      desiredTone: 'nordic',
      desiredLength: 'short',
      pronunciationPreference: 'crisp',
      wordType: 'invented',
      wordsToInclude: [],
      wordsToAvoid: ['tech', 'cloud', 'flow', 'hub'],
      lettersToAvoid: ['q', 'z'],
      conceptsToCommunicate: ['clarity', 'speed', 'fjord', 'precision', 'security'],
    });
    // Generate initial candidate shortlist for demo immediately
    executeProjectWorkflow(defaultBrief, 10).catch(err => {
      console.error('Initial background pipeline generation failed:', err);
    });
  }

  // ========================================================
  // Vite Middleware (Development) / Static Files (Production)
  // ========================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Name Discovery & Verification Engine running on port ${PORT}`);
  });
}

startServer();
