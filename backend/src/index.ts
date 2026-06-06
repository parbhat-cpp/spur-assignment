import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';

import apiRoutes from './routes';

const app: Express = express();

// CORS Configuration
const corsOrigin = process.env.NODE_ENV === "production" 
? process.env.CORS_ORIGIN || "*"
: "http://localhost:3000";

// database connection
const dbUrl = process.env.DB_URL ?? process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { logger: true });

app.use(cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
