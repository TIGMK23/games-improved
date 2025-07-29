import { simpleGit } from 'simple-git';
export class GitService {
    logger;
    constructor(logger) {
        this.logger = logger.createChildLogger('GitService');
    }
    async clone(gameId, config, targetDir) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to clone ${gameId}`, error);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    async checkout(gameId, targetDir, branch) {
        this.logger.info(`Checking out branch ${branch} for ${gameId}`);
        try {
            const git = simpleGit(targetDir);
            await git.checkout(branch);
            this.logger.success(`Successfully checked out ${branch} for ${gameId}`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to checkout ${branch} for ${gameId}`, error);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    async pull(gameId, targetDir) {
        this.logger.info(`Pulling latest changes for ${gameId}`);
        try {
            const git = simpleGit(targetDir);
            await git.pull();
            this.logger.success(`Successfully pulled latest changes for ${gameId}`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to pull changes for ${gameId}`, error);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    async getLatestCommit(targetDir) {
        try {
            const git = simpleGit(targetDir);
            const log = await git.log(['-1']);
            return log.latest?.hash || null;
        }
        catch (error) {
            this.logger.error('Failed to get latest commit', error);
            return null;
        }
    }
    isValidGitUrl(url) {
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
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=GitService.js.map