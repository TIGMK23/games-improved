import { Logger } from '../utils/Logger.js';
import { BuildConfig } from '../types/Build.js';
export interface DevServerConfig {
    port: number;
    host: string;
    openBrowser: boolean;
    watchFiles: boolean;
}
export declare class DevServer {
    private logger;
    private buildConfig;
    private serverConfig;
    private app;
    private builder;
    constructor(buildConfig: BuildConfig, serverConfig: DevServerConfig, logger: Logger);
    private setupMiddleware;
    private setupRoutes;
    private setupFileWatcher;
    start(): Promise<void>;
}
//# sourceMappingURL=DevServer.d.ts.map