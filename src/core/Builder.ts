import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/Logger.js';
import { GameConfig, GameMetadata, BuildStatus } from '../types/Game.js';
import { BuildConfig, BuildResult } from '../types/Build.js';
import { BuildService } from '../services/BuildService.js';
import { TemplateService } from '../services/TemplateService.js';

export class Builder {
  private logger: Logger;
  private config: BuildConfig;
  private buildService: BuildService;
  private templateService: TemplateService;

  constructor(config: BuildConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.createChildLogger('Builder');
    this.buildService = new BuildService(config, logger);
    this.templateService = new TemplateService(config, logger);
  }

  async buildAll(): Promise<BuildResult> {
    this.logger.info('Starting complete build process');

    try {
      // Ensure output directory exists
      await fs.ensureDir(this.config.outputDir);

      // Load games configuration
      const games = await this.loadGamesConfig();
      
      // Build all games
      const buildResult = await this.buildService.buildAll(games);
      
      // Generate website templates
      await this.templateService.generateIndex(buildResult.games);
      
      return buildResult;
    } catch (error) {
      this.logger.error('Build process failed', error);
      throw error;
    }
  }

  async listGames(): Promise<GameMetadata[]> {
    const games = await this.loadGamesConfig();
    
    return Object.entries(games).map(([gameId, config]) => ({
      id: gameId,
      config,
      buildStatus: BuildStatus.NOT_BUILT
    }));
  }

  private async loadGamesConfig(): Promise<{ [gameId: string]: GameConfig }> {
    const configPath = path.join(this.config.customDir, 'games.json');
    const fallbackPath = path.join(process.cwd(), '_build', 'games.php');
    
    // Try to load JSON config first
    if (await fs.pathExists(configPath)) {
      this.logger.info('Loading games from JSON config');
      return await fs.readJSON(configPath);
    }

    // Fallback to PHP config (for now)
    if (await fs.pathExists(fallbackPath)) {
      this.logger.info('Loading games from PHP config (legacy)');
      return await this.loadPhpGamesConfig(fallbackPath);
    }

    throw new Error('No games configuration found. Expected games.json or games.php');
  }

  private async loadPhpGamesConfig(phpFilePath: string): Promise<{ [gameId: string]: GameConfig }> {
    // For now, we'll use the existing PHP array format
    // In a real implementation, you might parse the PHP or convert it to JSON
    
    // This is a temporary solution - we should migrate to JSON config
    const phpContent = await fs.readFile(phpFilePath, 'utf-8');
    
    // Extract games array from PHP file (very basic parsing)
    // This is a simplified approach - in production you'd want proper PHP parsing
    if (phpContent.includes('$games = [')) {
      // For now, return the hardcoded games from the original PHP
      return this.getHardcodedGames();
    }

    throw new Error('Could not parse PHP games configuration');
  }

  private getHardcodedGames(): { [gameId: string]: GameConfig } {
    // This is temporary - we'll migrate to JSON config
    return {
      'hextris-lite': {
        name: 'Hextris',
        tag: 'hexagonal tetris',
        license: 'GPL-3.0',
        git: 'https://github.com/attogram/hextris-lite.git',
        mobile: true,
        desktop: true,
      },
      'pond': {
        name: 'The Pond',
        tag: 'eat, swim, love',
        license: 'GPL-3.0',
        git: 'https://github.com/attogram/pond-lite.git',
        mobile: true,
        desktop: true,
      },
      '2048-lite': {
        name: '2048',
        tag: '2, 4, 8, swipe',
        license: 'MIT',
        git: 'https://github.com/attogram/2048-lite.git',
        mobile: true,
        desktop: true,
      },
      'taptaptap': {
        name: 'Tap Tap Tap',
        tag: 'tap the blue',
        license: 'MIT',
        git: 'https://github.com/MahdiF/taptaptap.git',
        index: 'play/',
        mobile: true,
        desktop: true,
      },
      'particle-clicker': {
        name: 'Particle Clicker',
        tag: 'be like CERN',
        license: 'MIT',
        git: 'https://github.com/particle-clicker/particle-clicker.git',
        mobile: true,
        desktop: true,
      }
    };
  }
}
