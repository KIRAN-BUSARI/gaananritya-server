import { app } from './app.js';
import { connectDB } from './db/index.js';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import compression from 'compression';
import helmet from 'helmet';

dotenv.config({
  path: "./.env"
});

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "*.cloudinary.com", "*.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "*.googleapis.com"],
      imgSrc: ["'self'", "data:", "*.cloudinary.com", "blob:"],
      mediaSrc: ["'self'", "*.cloudinary.com"],
      connectSrc: ["'self'", "*.cloudinary.com"],
      fontSrc: ["'self'", "*.googleapis.com", "*.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "*.youtube.com"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
    else if (req.url.startsWith('/api/v1/') && !req.url.includes('/user/')) {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    }
    else if (req.url.includes('/user/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
  next();
});

const ENABLE_CLUSTERING = process.env.ENABLE_CLUSTERING === 'true';
const numCPUs = os.cpus().length;

const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`⚡️ Server is running at http://localhost:${port}`);
    });

  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

if (ENABLE_CLUSTERING && cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);

  const workerCount = Math.min(numCPUs, 4);

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}
