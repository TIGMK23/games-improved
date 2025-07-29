export interface BuildConfig {
    outputDir: string;
    templatesDir: string;
    customDir: string;
    logoDir: string;
    concurrency: number;
    enableCache: boolean;
    skipExisting: boolean;
}
export interface BuildResult {
    success: boolean;
    totalGames: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    totalDuration: number;
    startTime: Date;
    endTime: Date;
    games: GameBuildResult[];
    errors: BuildError[];
    warnings: string[];
}
export interface BuildError {
    message: string;
    gameId?: string;
    phase: BuildPhase;
    cause?: Error;
    timestamp: Date;
}
export declare enum BuildPhase {
    SETUP = "setup",
    CLONE = "clone",
    CHECKOUT = "checkout",
    BUILD = "build",
    TEMPLATE = "template",
    ASSETS = "assets",
    FINALIZE = "finalize"
}
export interface BuildMetrics {
    totalTime: number;
    gamesBuildTime: {
        [gameId: string]: number;
    };
    errors: BuildError[];
    warnings: string[];
    resourceUsage: {
        memory: number;
        disk: number;
        cpu: number;
    };
}
import type { GameBuildResult } from './Game.js';
//# sourceMappingURL=Build.d.ts.map