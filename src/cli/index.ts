#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Logger, LogLevel } from '../utils/Logger.js';
import { Builder } from '../core/Builder.js';
import { BuildConfig } from '../types/Build.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const program = new Command();
const VERSION = '2.0.0';

program
  .name('attogram-games')
  .description('Modern games website builder - TypeScript edition')
  .version(VERSION);

program
  .command('build')
  .description('Build games website')
  .option('-c, --concurrency <number>', 'Number of parallel builds', '4')
  .option('-o, --output <dir>', 'Output directory', process.cwd())
  .option('--skip-existing', 'Skip games that already exist', false)
  .option('--no-cache', 'Disable build cache', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--dry-run', 'Show what would be built without actually building', false)
  .action(async (options) => {
    const logger = new Logger({ 
      level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO 
    });

    const spinner = ora('Initializing build process...').start();

    try {
      const config: BuildConfig = {
        outputDir: path.resolve(options.output),
        templatesDir: path.join(process.cwd(), '_build', 'templates'),
        customDir: path.join(process.cwd(), '_build', 'custom'),
        logoDir: path.join(process.cwd(), '_logo'),
        concurrency: parseInt(options.concurrency) || os.cpus().length,
        enableCache: !options.noCache,
        skipExisting: options.skipExisting
      };

      spinner.succeed('Configuration loaded');
      
      if (options.dryRun) {
        logger.info('Dry run mode - no actual builds will be performed');
      }

      const builder = new Builder(config, logger);
      
      if (options.dryRun) {
        const gamesList = await builder.listGames();
        console.log('\nGames that would be built:');
        gamesList.forEach((game: any) => {
          console.log(`  ${chalk.cyan(game.id)} - ${game.config.name}`);
        });
        return;
      }

      const result = await builder.buildAll();
      
      if (result.success) {
        console.log(chalk.green('\n✅ Build completed successfully!'));
        console.log(`Built ${result.successCount} games in ${result.totalDuration}ms`);
      } else {
        console.log(chalk.red('\n❌ Build completed with errors'));
        console.log(`Success: ${result.successCount}, Failed: ${result.failedCount}`);
        
        if (result.errors.length > 0) {
          console.log('\nErrors:');
          result.errors.forEach(error => {
            console.log(`  ${chalk.red('•')} ${error.message}`);
          });
        }
        process.exit(1);
      }
    } catch (error: any) {
      spinner.fail('Build failed');
      logger.error('Build process failed', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available games')
  .option('-v, --verbose', 'Show detailed game information', false)
  .action(async (options) => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    try {
      const config: BuildConfig = {
        outputDir: process.cwd(),
        templatesDir: path.join(process.cwd(), '_build', 'templates'),
        customDir: path.join(process.cwd(), '_build', 'custom'),
        logoDir: path.join(process.cwd(), '_logo'),
        concurrency: 1,
        enableCache: true,
        skipExisting: false
      };

      const builder = new Builder(config, logger);
      const games = await builder.listGames();
      
      console.log(chalk.blue(`\nFound ${games.length} games:\n`));
      
      games.forEach((game: any) => {
        console.log(`${chalk.cyan(game.id)} - ${chalk.white(game.config.name)}`);
        if (options.verbose) {
          console.log(`  ${chalk.gray('Tag:')} ${game.config.tag}`);
          console.log(`  ${chalk.gray('License:')} ${game.config.license}`);
          console.log(`  ${chalk.gray('Repository:')} ${game.config.git}`);
          console.log(`  ${chalk.gray('Mobile:')} ${game.config.mobile ? '✅' : '❌'}`);
          console.log(`  ${chalk.gray('Desktop:')} ${game.config.desktop ? '✅' : '❌'}`);
          if (game.config.branch) {
            console.log(`  ${chalk.gray('Branch:')} ${game.config.branch}`);
          }
          console.log('');
        }
      });
    } catch (error) {
      console.error(chalk.red('Failed to list games'), error);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Clean build output directory')
  .option('-o, --output <dir>', 'Output directory to clean', process.cwd())
  .option('--force', 'Force clean without confirmation', false)
  .action(async (options) => {
    const logger = new Logger({ level: LogLevel.INFO });
    const outputDir = path.resolve(options.output);
    
    if (!options.force) {
      console.log(chalk.yellow(`This will remove all built games from: ${outputDir}`));
      console.log(chalk.yellow('Use --force to skip this confirmation'));
      return;
    }

    const spinner = ora('Cleaning build directory...').start();
    
    try {
      // Get list of game directories to remove
      const items = await fs.readdir(outputDir);
      let removedCount = 0;
      
      for (const item of items) {
        const itemPath = path.join(outputDir, item);
        const stat = await fs.stat(itemPath);
        
        // Only remove directories, preserve files like index.html
        if (stat.isDirectory() && !item.startsWith('.') && !item.startsWith('_')) {
          await fs.remove(itemPath);
          removedCount++;
          logger.debug(`Removed: ${item}`);
        }
      }
      
      spinner.succeed(`Cleaned ${removedCount} game directories`);
    } catch (error) {
      spinner.fail('Clean failed');
      logger.error('Failed to clean build directory', error);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start development server (coming soon)')
  .action(() => {
    console.log(chalk.yellow('Development server not yet implemented'));
    console.log('This feature will be available in Phase 2 of the modernization plan');
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  console.error(chalk.red('Command failed:'), error);
  process.exit(1);
}
