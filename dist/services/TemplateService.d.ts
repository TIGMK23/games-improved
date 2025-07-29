import { Logger } from '../utils/Logger.js';
import { GameBuildResult } from '../types/Game.js';
import { BuildConfig } from '../types/Build.js';
export interface TemplateData {
    title: string;
    headline: string;
    games: GameBuildResult[];
    buildTime: string;
    version: string;
}
export declare class TemplateService {
    private logger;
    private config;
    constructor(config: BuildConfig, logger: Logger);
    generateIndex(games: GameBuildResult[]): Promise<void>;
    private loadTemplate;
    private getDefaultTemplate;
}
//# sourceMappingURL=TemplateService.d.ts.map