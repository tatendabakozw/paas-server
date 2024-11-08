import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import logger from '@utils/logger'; // Winston logger with path alias
import { setupSwagger } from '@utils/swagger'; // Import Swagger setup
import connectDB from '@config/mongoConfig';
import passport from '@config/passportConfig';
import authRoutes from '@routes/authRoutes';
import userRoutes from '@routes/userRoutes';
import githubRoutes from '@routes/githubRoutes';
import projectRoutes from '@routes/project.route'
import activityRoutes from '@routes/activity.route'
import { PORT, SESSION_SECRET } from '@utils/constants';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Log HTTP requests to console in development
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Setup Swagger for API documentation
setupSwagger(app);

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  logger.info('Health check endpoint was called');
  res.send('Server running on PAAS');
});

// Use the main router

// Global error handler for catching unexpected errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unexpected error: ${err.message}`);
  res.status(500).json({ error: 'An internal server error occurred' });
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/activity', activityRoutes);

// Start the server
app.listen(PORT, () => {
  logger.info(`⚡️ Server is running on http://localhost:${PORT}`);
});
