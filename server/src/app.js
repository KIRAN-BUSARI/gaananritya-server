import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from "dotenv";
import cors from 'cors';
config({
  path: "./.env"
});

const app = express();

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(morgan('dev'));
app.use(cookieParser())

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}
));

app.get('/', (_, res) => {
  res.json({ message: 'Hello World' });
});

// Routes
import userRoutes from './routes/user.routes.js';
import blogRoutes from "./routes/blog.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use('/api/v1/gallery', galleryRoutes);

export { app };