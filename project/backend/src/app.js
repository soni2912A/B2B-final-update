const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();


process.on('uncaughtException',  (err) => console.error('[uncaughtException]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));


app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean);
const devDefaults = process.env.NODE_ENV !== 'production'
  ? ['http://localhost:5173', 'http://127.0.0.1:5173']
  : [];
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...devDefaults]));

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.length === 0) return callback(null, true); 
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api/v1/auth/login',           authLimiter);
app.use('/api/v1/auth/register',        authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/',                        apiLimiter);


app.use(
  '/uploads',
  (req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); },
  express.static(path.join(__dirname, '../uploads'), { fallthrough: false }),
);

app.use('/api/v1', routes);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(errorHandler);

module.exports = app;
