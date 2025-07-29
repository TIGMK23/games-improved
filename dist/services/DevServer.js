import express from 'express';
import path from 'path';
import chokidar from 'chokidar';
import { Builder } from '../core/Builder.js';
export class DevServer {
    logger;
    buildConfig;
    serverConfig;
    app;
    builder;
    constructor(buildConfig, serverConfig, logger) {
        this.buildConfig = buildConfig;
        this.serverConfig = serverConfig;
        this.logger = logger.createChildLogger('DevServer');
        this.app = express();
        this.builder = new Builder(buildConfig, logger);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Serve static files from the output directory
        this.app.use(express.static(this.buildConfig.outputDir));
        // Enable CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        // Logging middleware
        this.app.use((req, res, next) => {
            this.logger.debug(`${req.method} ${req.url}`);
            next();
        });
    }
    setupRoutes() {
        // API endpoint to get games list
        this.app.get('/api/games', async (req, res) => {
            try {
                const games = await this.builder.listGames();
                res.json(games);
            }
            catch (error) {
                this.logger.error('Failed to fetch games list', error);
                res.status(500).json({ error: 'Failed to fetch games list' });
            }
        });
        // API endpoint to trigger rebuild
        this.app.post('/api/rebuild', async (req, res) => {
            try {
                this.logger.info('Rebuilding games...');
                const result = await this.builder.buildAll();
                res.json(result);
            }
            catch (error) {
                this.logger.error('Rebuild failed', error);
                res.status(500).json({ error: 'Rebuild failed' });
            }
        });
        // Catch-all handler: send back index.html for client-side routing
        this.app.get('*', (req, res) => {
            const indexPath = path.join(this.buildConfig.outputDir, 'index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    this.logger.error('Failed to serve index.html', err);
                    res.status(404).send('Games website not built. Run `npm run build` first.');
                }
            });
        });
    }
    setupFileWatcher() {
        if (!this.serverConfig.watchFiles)
            return;
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
        watcher.on('change', async (filePath) => {
            this.logger.info(`File changed: ${filePath}`);
            this.logger.info('Rebuilding website...');
            try {
                await this.builder.buildAll();
                this.logger.success('Website rebuilt successfully');
            }
            catch (error) {
                this.logger.error('Rebuild failed', error);
            }
        });
        this.logger.info('File watcher started');
    }
    async start() {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(this.serverConfig.port, this.serverConfig.host, async () => {
                const url = `http://${this.serverConfig.host}:${this.serverConfig.port}`;
                this.logger.success(`Development server running at ${url}`);
                if (this.serverConfig.openBrowser) {
                    try {
                        const open = await import('open');
                        await open.default(url);
                    }
                    catch (error) {
                        this.logger.warn('Could not open browser automatically');
                    }
                }
                this.setupFileWatcher();
                resolve();
            });
            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    this.logger.error(`Port ${this.serverConfig.port} is already in use`);
                }
                else {
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
//# sourceMappingURL=DevServer.js.map