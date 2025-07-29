import { Logger } from '../utils/Logger.js';
import { GameConfig } from '../types/Game.js';
export interface GitOperationResult {
    success: boolean;
    error?: string;
    commit?: string;
}
export declare class GitService {
    private logger;
    constructor(logger: Logger);
    clone(gameId: string, config: GameConfig, targetDir: string): Promise<GitOperationResult>;
    checkout(gameId: string, targetDir: string, branch: string): Promise<GitOperationResult>;
    pull(gameId: string, targetDir: string): Promise<GitOperationResult>;
    getLatestCommit(targetDir: string): Promise<string | null>;
    private isValidGitUrl;
}
//# sourceMappingURL=GitService.d.ts.map