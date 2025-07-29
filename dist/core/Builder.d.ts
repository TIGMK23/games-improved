import { Logger } from '../utils/Logger.js';
import { GameMetadata } from '../types/Game.js';
import { BuildConfig, BuildResult } from '../types/Build.js';
export declare class Builder {
    private logger;
    private config;
    private buildService;
    private templateService;
    constructor(config: BuildConfig, logger: Logger);
    buildAll(): Promise<BuildResult>;
    listGames(): Promise<GameMetadata[]>;
    private loadGamesConfig;
    private loadPhpGamesConfig;
    private getHardcodedGames;
}
//# sourceMappingURL=Builder.d.ts.map