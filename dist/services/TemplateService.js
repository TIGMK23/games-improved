import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
export class TemplateService {
    logger;
    config;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger.createChildLogger('TemplateService');
    }
    async generateIndex(games) {
        this.logger.info('Generating index.html');
        try {
            // Load template
            const template = await this.loadTemplate('index.hbs');
            // Prepare template data
            const templateData = {
                title: 'Attogram Games Website',
                headline: 'Open Source Web Games Collection',
                games: games.filter(g => g.success), // Only include successful builds
                buildTime: new Date().toISOString(),
                version: '2.0.0'
            };
            // Compile and render template
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate(templateData);
            // Write index.html
            const outputPath = path.join(this.config.outputDir, 'index.html');
            await fs.writeFile(outputPath, html, 'utf-8');
            this.logger.success(`Generated index.html with ${templateData.games.length} games`);
        }
        catch (error) {
            this.logger.error('Failed to generate index.html', error);
            throw error;
        }
    }
    async loadTemplate(templateName) {
        // Try custom template first
        const customPath = path.join(this.config.customDir, templateName);
        if (await fs.pathExists(customPath)) {
            this.logger.debug(`Using custom template: ${templateName}`);
            return await fs.readFile(customPath, 'utf-8');
        }
        // Try modern templates
        const modernPath = path.join(this.config.templatesDir, 'modern', templateName);
        if (await fs.pathExists(modernPath)) {
            this.logger.debug(`Using modern template: ${templateName}`);
            return await fs.readFile(modernPath, 'utf-8');
        }
        // Fallback to default template
        this.logger.debug(`Using default template: ${templateName}`);
        return this.getDefaultTemplate();
    }
    getDefaultTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .header {
            text-align: center;
            padding: 2rem;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .game-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
            color: inherit;
        }
        
        .game-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        
        .game-content {
            padding: 1.5rem;
        }
        
        .game-name {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2c3e50;
        }
        
        .game-tag {
            color: #7f8c8d;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .game-platforms {
            display: flex;
            gap: 0.5rem;
            font-size: 1.2rem;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: white;
            opacity: 0.8;
        }
        
        @media (max-width: 768px) {
            .games-grid {
                grid-template-columns: 1fr;
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>{{headline}}</h1>
        <p>{{games.length}} Open Source Web Games</p>
    </header>

    <main class="games-grid">
        {{#each games}}
        <a href="{{game.id}}/{{#if game.config.index}}{{game.config.index}}{{/if}}" class="game-card">
            <div class="game-content">
                <div class="game-name">{{game.config.name}}</div>
                <div class="game-tag">{{game.config.tag}}</div>
                <div class="game-platforms">
                    {{#if game.config.desktop}}🖥️{{/if}}
                    {{#if game.config.mobile}}📱{{/if}}
                </div>
            </div>
        </a>
        {{/each}}
    </main>

    <footer class="footer">
        <p>Built with Attogram Games {{version}} • Generated {{buildTime}}</p>
        <p>All games are open source and free to play</p>
    </footer>
</body>
</html>`;
    }
}
//# sourceMappingURL=TemplateService.js.map