// backend/src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import skillRoutes from './routes/skillRoutes';
import taskRoutes from './routes/taskRoutes';
import cors from 'cors'; // For handling CORS policies

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON requests
app.use(cors()); // Allow all origins for development (configure for production)

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/tasks', taskRoutes);


// Basic error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


export default app;