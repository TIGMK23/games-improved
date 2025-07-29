import { simpleGit, SimpleGit, GitError } from 'simple-git';
import { Logger } from '../utils/Logger.js';
import { GameConfig } from '../types/Game.js';
import { BuildError, BuildPhase } from '../types/Build.js';

export interface GitOperationResult {
  success: boolean;
  error?: string;
  commit?: string;
}

export class GitService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.createChildLogger('GitService');
  }

  async clone(gameId: string, config: GameConfig, targetDir: string): Promise<GitOperationResult> {
    this.logger.info(`Cloning ${gameId} from ${config.git}`);
    
    try {
      // Validate git URL
      if (!this.isValidGitUrl(config.git)) {
        throw new Error(`Invalid git URL: ${config.git}`);
      }

      const git = simpleGit();
      await git.clone(config.git, targetDir);
      
      this.logger.success(`Successfully cloned ${gameId}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to clone ${gameId}`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async checkout(gameId: string, targetDir: string, branch: string): Promise<GitOperationResult> {
    this.logger.info(`Checking out branch ${branch} for ${gameId}`);
    
    try {
      const git = simpleGit(targetDir);
      await git.checkout(branch);
      
      this.logger.success(`Successfully checked out ${branch} for ${gameId}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to checkout ${branch} for ${gameId}`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async pull(gameId: string, targetDir: string): Promise<GitOperationResult> {
    this.logger.info(`Pulling latest changes for ${gameId}`);
    
    try {
      const git = simpleGit(targetDir);
      await git.pull();
      
      this.logger.success(`Successfully pulled latest changes for ${gameId}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to pull changes for ${gameId}`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getLatestCommit(targetDir: string): Promise<string | null> {
    try {
      const git = simpleGit(targetDir);
      const log = await git.log(['-1']);
      return log.latest?.hash || null;
    } catch (error) {
      this.logger.error('Failed to get latest commit', error);
      return null;
    }
  }

  private isValidGitUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Allow https and git protocols
      if (!['https:', 'git:'].includes(parsedUrl.protocol)) {
        return false;
      }
      
      // Basic validation for common git hosting services
      const allowedHosts = [
        'github.com',
        'gitlab.com',
        'bitbucket.org',
        'codeberg.org'
      ];
      
      // Allow any host for now, but log warning for unknown hosts
      if (!allowedHosts.includes(parsedUrl.hostname)) {
        this.logger.warn(`Unknown git host: ${parsedUrl.hostname}`);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
