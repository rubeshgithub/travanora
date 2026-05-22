import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.handler.js';
import authRouter from './modules/auth/auth.router.js';
import membersRouter from './modules/members/members.router.js';
import flightsRouter from './modules/flights/flights.router.js';
import meRouter from './modules/me/me.router.js';
import bookingsRouter from './modules/bookings/booking.router.js';
import placesRouter from './modules/places/places.router.js';

const app: Express = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, mobile apps in dev)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, service: 'travanora-api' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/members', membersRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/flights', bookingsRouter);
app.use('/api/places', placesRouter);

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
