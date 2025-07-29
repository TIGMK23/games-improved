import { Logger } from '../utils/Logger.js';
import { GameConfig, GameBuildResult } from '../types/Game.js';
import { BuildConfig, BuildResult } from '../types/Build.js';
export declare class BuildService {
    private logger;
    private gitService;
    private config;
    constructor(config: BuildConfig, logger: Logger);
    buildAll(gameConfigs: {
        [gameId: string]: GameConfig;
    }): Promise<BuildResult>;
    buildGame(gameId: string, config: GameConfig): Promise<GameBuildResult>;
    private executeBuildSteps;
}
//# sourceMappingURL=BuildService.d.ts.map