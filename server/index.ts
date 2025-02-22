import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";

// Initialize Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use((_req, res, next) => {
  // Set CSP headers
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
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

    // Serve static files from client/dist in production or client/public in development
    const staticPath = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, '../dist/public')
      : path.join(__dirname, '../client/public');

    app.use(express.static(staticPath));

    // Handle client-side routing by serving index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(__dirname, '../client/index.html'));
    });

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