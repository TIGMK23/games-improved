import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { Logger } from '../utils/Logger.js';
import { BuildConfig } from '../types/Build.js';
import chokidar from 'chokidar';
import { Builder } from '../core/Builder.js';

export interface DevServerConfig {
  port: number;
  host: string;
  openBrowser: boolean;
  watchFiles: boolean;
}

export class DevServer {
  private logger: Logger;
  private buildConfig: BuildConfig;
  private serverConfig: DevServerConfig;
  private app: express.Application;
  private builder: Builder;

  constructor(buildConfig: BuildConfig, serverConfig: DevServerConfig, logger: Logger) {
    this.buildConfig = buildConfig;
    this.serverConfig = serverConfig;
    this.logger = logger.createChildLogger('DevServer');
    this.app = express();
    this.builder = new Builder(buildConfig, logger);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Serve static files from the output directory
    this.app.use(express.static(this.buildConfig.outputDir));
    
    // Enable CORS for development
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.debug(`${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes(): void {
    // API endpoint to get games list
    this.app.get('/api/games', async (req: Request, res: Response) => {
      try {
        const games = await this.builder.listGames();
        res.json(games);
      } catch (error) {
        this.logger.error('Failed to fetch games list', error);
        res.status(500).json({ error: 'Failed to fetch games list' });
      }
    });

    // API endpoint to trigger rebuild
    this.app.post('/api/rebuild', async (req: Request, res: Response) => {
      try {
        this.logger.info('Rebuilding games...');
        const result = await this.builder.buildAll();
        res.json(result);
      } catch (error) {
        this.logger.error('Rebuild failed', error);
        res.status(500).json({ error: 'Rebuild failed' });
      }
    });

    // Catch-all handler: send back index.html for client-side routing
    this.app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(this.buildConfig.outputDir, 'index.html');
      res.sendFile(indexPath, (err: any) => {
        if (err) {
          this.logger.error('Failed to serve index.html', err);
          res.status(404).send('Games website not built. Run `npm run build` first.');
        }
      });
    });
  }

  private setupFileWatcher(): void {
    if (!this.serverConfig.watchFiles) return;

    const watchPaths = [
      path.join(this.buildConfig.templatesDir, '**/*'),
      path.join(this.buildConfig.customDir, '**/*'),
      path.join(process.cwd(), '_build', 'games.php'),
      path.join(process.cwd(), '_build', 'config.php')
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath: string) => {
      this.logger.info(`File changed: ${filePath}`);
      this.logger.info('Rebuilding website...');
      
      try {
        await this.builder.buildAll();
        this.logger.success('Website rebuilt successfully');
      } catch (error) {
        this.logger.error('Rebuild failed', error);
      }
    });

    this.logger.info('File watcher started');
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.serverConfig.port, this.serverConfig.host, async () => {
        const url = `http://${this.serverConfig.host}:${this.serverConfig.port}`;
        this.logger.success(`Development server running at ${url}`);
        
        if (this.serverConfig.openBrowser) {
          try {
            const open = await import('open');
            await open.default(url);
          } catch (error) {
            this.logger.warn('Could not open browser automatically');
          }
        }

        this.setupFileWatcher();
        resolve();
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          this.logger.error(`Port ${this.serverConfig.port} is already in use`);
        } else {
          this.logger.error('Failed to start development server', error);
        }
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logger.info('Shutting down development server...');
        server.close(() => {
          this.logger.info('Development server stopped');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        this.logger.info('Shutting down development server...');
        server.close(() => {
          this.logger.info('Development server stopped');
          process.exit(0);
        });
      });
    });
  }
}
