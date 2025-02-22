import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES modules dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure MIME types for ES modules
app.use((_req, res, next) => {
  // Set CSP headers and MIME types
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`${req.method} ${req.path} - Starting request`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Start server setup
(async () => {
  try {
    const server = registerRoutes(app);

    // In development mode, let Vite handle all static files
    if (process.env.NODE_ENV !== 'production') {
      const { setupVite } = await import('./vite.js');
      await setupVite(app, server);
    } else {
      // In production, serve compiled static files
      const staticPath = path.join(__dirname, '../dist/public');

      app.use(express.static(staticPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
        }
      }));

      // Handle client-side routing in production
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(staticPath, 'index.html'));
      });
    }

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // Get port from environment variable or use default
    const startPort = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    log(`Initial port configuration: ${startPort}`);

    // Function to try binding to a port
    const tryBindPort = async (port: number): Promise<number> => {
      return new Promise((resolve, reject) => {
        log(`Attempting to bind to port ${port}`);

        const serverInstance = server.listen(port, "0.0.0.0", () => {
          log(`Successfully bound to port ${port}`);
          resolve(port);
        });

        serverInstance.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            log(`Port ${port} is in use, will try next port`);
            serverInstance.close();
            if (port < 5010) { // Try up to port 5010
              tryBindPort(port + 1).then(resolve).catch(reject);
            } else {
              reject(new Error('No available ports found between 5000 and 5010'));
            }
          } else {
            reject(error);
          }
        });
      });
    };

    try {
      const boundPort = await tryBindPort(startPort);
      log(`Server is running on port ${boundPort}`);
    } catch (error) {
      console.error('Failed to bind to any port:', error);
      process.exit(1);
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();