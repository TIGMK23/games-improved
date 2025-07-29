import { spawn } from 'child_process'; 
import fs from 'fs-extra';
import path from 'path';
import pLimit from 'p-limit';
import { Logger } from '../utils/Logger.js';
import { GameConfig, GameMetadata, BuildStatus, GameBuildResult } from '../types/Game.js';
import { BuildConfig, BuildResult, BuildError, BuildPhase } from '../types/Build.js';
import { GitService } from './GitService.js';

export class BuildService {
  private logger: Logger;
  private gitService: GitService;
  private config: BuildConfig;

  constructor(config: BuildConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.createChildLogger('BuildService');
    this.gitService = new GitService(logger);
  }

  async buildAll(gameConfigs: { [gameId: string]: GameConfig }): Promise<BuildResult> {
    const startTime = new Date();
    this.logger.info(`Starting build process for ${Object.keys(gameConfigs).length} games`);

    // Setup parallel processing
    const limit = pLimit(this.config.concurrency);
    const buildPromises: Promise<GameBuildResult>[] = [];

    // Create build promises for each game
    for (const [gameId, gameConfig] of Object.entries(gameConfigs)) {
      const buildPromise = limit(() => this.buildGame(gameId, gameConfig));
      buildPromises.push(buildPromise);
    }

    // Execute all builds
    const gameResults = await Promise.allSettled(buildPromises);
    const endTime = new Date();

    // Process results
    const gameResultsArray: GameBuildResult[] = [];
    const errors: BuildError[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const result of gameResults) {
      if (result.status === 'fulfilled') {
        gameResultsArray.push(result.value);
        if (result.value.success) {
          successCount++;
        } else {
          failedCount++;
          // Convert game errors to build errors
          result.value.errors.forEach(error => {
            errors.push({
              message: error,
              gameId: result.value.game.id,
              phase: BuildPhase.BUILD,
              timestamp: new Date()
            });
          });
        }
      } else {
        failedCount++;
        errors.push({
          message: result.reason?.message || 'Unknown error',
          phase: BuildPhase.BUILD,
          timestamp: new Date()
        });
      }
    }

    const totalDuration = endTime.getTime() - startTime.getTime();
    const buildResult: BuildResult = {
      success: failedCount === 0,
      totalGames: Object.keys(gameConfigs).length,
      successCount,
      failedCount,
      skippedCount,
      totalDuration,
      startTime,
      endTime,
      games: gameResultsArray,
      errors,
      warnings: []
    };

    this.logger.info(`Build completed in ${totalDuration}ms`, {
      success: successCount,
      failed: failedCount,
      skipped: skippedCount
    });

    return buildResult;
  }

  async buildGame(gameId: string, config: GameConfig): Promise<GameBuildResult> {
    const startTime = performance.now();
    const gameDir = path.join(this.config.outputDir, gameId);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.logger.info(`Building game: ${gameId}`);

    const metadata: GameMetadata = {
      id: gameId,
      config,
      buildStatus: BuildStatus.BUILDING,
      lastBuilt: new Date()
    };

    try {
      // Check if game already exists and skip if configured
      if (this.config.skipExisting && await fs.pathExists(gameDir)) {
        this.logger.info(`Skipping ${gameId} - already exists`);
        metadata.buildStatus = BuildStatus.SKIPPED;
        return {
          game: metadata,
          success: true,
          duration: performance.now() - startTime,
          errors: [],
          warnings: ['Skipped - already exists']
        };
      }

      // Clone repository
      const cloneResult = await this.gitService.clone(gameId, config, gameDir);
      if (!cloneResult.success) {
        throw new Error(`Clone failed: ${cloneResult.error}`);
      }

      // Checkout specific branch if specified
      if (config.branch) {
        const checkoutResult = await this.gitService.checkout(gameId, gameDir, config.branch);
        if (!checkoutResult.success) {
          throw new Error(`Checkout failed: ${checkoutResult.error}`);
        }
      }

      // Get latest commit for tracking
      const latestCommit = await this.gitService.getLatestCommit(gameDir);
      if (latestCommit) {
        metadata.lastCommit = latestCommit;
      }

      // Execute build steps if specified
      if (config.build && config.build.length > 0) {
        await this.executeBuildSteps(gameId, gameDir, config.build);
      }

      metadata.buildStatus = BuildStatus.SUCCESS;
      metadata.buildTime = performance.now() - startTime;

      this.logger.success(`Successfully built ${gameId} in ${metadata.buildTime.toFixed(2)}ms`);

      return {
        game: metadata,
        success: true,
        duration: metadata.buildTime,
        errors,
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      metadata.buildStatus = BuildStatus.FAILED;
      metadata.buildErrors = errors;

      this.logger.error(`Failed to build ${gameId}`, error);

      return {
        game: metadata,
        success: false,
        duration: performance.now() - startTime,
        errors,
        warnings
      };
    }
  }

  private async executeBuildSteps(gameId: string, gameDir: string, buildSteps: string[]): Promise<void> {
    this.logger.info(`Executing ${buildSteps.length} build steps for ${gameId}`);

    for (let i = 0; i < buildSteps.length; i++) {
      const step = buildSteps[i];
      if (!step) continue;
      
      this.logger.debug(`Executing step ${i + 1}/${buildSteps.length}: ${step}`);

      await new Promise<void>((resolve, reject) => {
        const parts = step.split(' ');
        const command = parts[0];
        const args = parts.slice(1);
        
        if (!command) {
          reject(new Error(`Invalid build step: ${step}`));
          return;
        }

        const child = spawn(command, args, {
          cwd: gameDir,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        child.on('close', (code: number | null) => {
          if (code === 0) {
            this.logger.debug(`Step completed: ${step}`);
            resolve();
          } else {
            const error = new Error(`Build step failed with code ${code}: ${step}\nStderr: ${stderr}`);
            reject(error);
          }
        });

        child.on('error', (error: Error) => {
          reject(new Error(`Failed to execute build step: ${step}\nError: ${error.message}`));
        });
      });
    }

    this.logger.success(`All build steps completed for ${gameId}`);
  }
}
