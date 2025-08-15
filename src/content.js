class ArticleSummarizer {
    constructor() {
        this.detector = null;
        this.textExtractor = null;
        this.floatingUI = null;
        this.summaryRenderer = null;
        this.chatInterface = null;
        this.apiClient = null;
        
        this.articleData = null;
        this.isActive = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 [ArticleSummarizer] Initializing extension on:', window.location.href);
            console.log('📊 [ArticleSummarizer] Document ready state:', document.readyState);
            
            // Load all required modules
            console.log('📦 [ArticleSummarizer] Starting module loading process...');
            await this.loadModules();
            console.log('✅ [ArticleSummarizer] All modules loaded successfully');
            
            // Initialize components
            console.log('🔧 [ArticleSummarizer] Initializing components...');
            this.initializeComponents();
            console.log('✅ [ArticleSummarizer] Components initialized successfully');
            
            // Wait for page to be ready
            if (document.readyState === 'loading') {
                console.log('⏳ [ArticleSummarizer] Waiting for DOMContentLoaded...');
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                console.log('▶️ [ArticleSummarizer] DOM ready, starting immediately');
                this.start();
            }
        } catch (error) {
            console.error('Failed to initialize Article Summarizer:', error);
        }
    }

    async loadModules() {
        // Load modules in dependency order to avoid issues
        const moduleGroups = [
            // Core modules first
            ['api/n8n-client.js'],
            // Detection and extraction
            ['content/article-detector.js', 'content/text-extractor.js'],
            // UI modules
            ['ui/summary-renderer.js', 'ui/chat-interface.js'],
            // UI management last
            ['content/floating-ui.js']
        ];

        // Load each group sequentially
        for (const group of moduleGroups) {
            await this.loadModuleGroup(group);
        }

        // Wait for all classes to be available
        await this.waitForModules();
    }

    async loadModuleGroup(urls) {
        const loadPromises = urls.map(url => this.loadSingleModule(url));
        await Promise.all(loadPromises);
    }

    async loadSingleModule(url) {
        return new Promise((resolve, reject) => {
            console.log(`Loading module: ${url}`);
            
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(url);
            
            script.onload = () => {
                console.log(`Module loaded: ${url}`);
                // Small delay to ensure class registration
                setTimeout(resolve, 10);
            };
            
            script.onerror = (error) => {
                console.error(`Failed to load module: ${url}`, error);
                reject(new Error(`Failed to load ${url}`));
            };
            
            document.head.appendChild(script);
        });
    }

    async waitForModules() {
        const requiredClasses = [
            'ArticleDetector',
            'TextExtractor', 
            'FloatingUI',
            'SummaryRenderer',
            'ChatInterface',
            'N8NClient'
        ];

        const maxAttempts = 10;
        const delay = 100; // milliseconds

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`Checking for modules, attempt ${attempt}/${maxAttempts}`);
            
            const missingClasses = requiredClasses.filter(className => {
                const isAvailable = window[className] !== undefined;
                if (!isAvailable) {
                    console.warn(`Module not yet available: ${className}`);
                }
                return !isAvailable;
            });

            if (missingClasses.length === 0) {
                console.log('All modules are available!');
                return;
            }

            if (attempt === maxAttempts) {
                throw new Error(`Missing modules after ${maxAttempts} attempts: ${missingClasses.join(', ')}`);
            }

            // Exponential backoff
            await this.sleep(delay * Math.pow(2, attempt - 1));
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    initializeComponents() {
        try {
            console.log('Initializing components...');
            
            // Validate each class before instantiating
            this.validateAndInitialize('ArticleDetector', () => {
                this.detector = new window.ArticleDetector();
            });
            
            this.validateAndInitialize('TextExtractor', () => {
                this.textExtractor = new window.TextExtractor();
            });
            
            this.validateAndInitialize('FloatingUI', () => {
                this.floatingUI = new window.FloatingUI();
            });
            
            this.validateAndInitialize('SummaryRenderer', () => {
                this.summaryRenderer = new window.SummaryRenderer();
            });
            
            // N8NClient is already instantiated, just reference it
            if (!window.N8NClient) {
                throw new Error('N8NClient not available');
            }
            this.apiClient = window.N8NClient;
            
            console.log('All components initialized successfully');
        } catch (error) {
            console.error('Component initialization failed:', error);
            throw error;
        }
    }

    validateAndInitialize(className, initFunction) {
        if (!window[className]) {
            throw new Error(`${className} class not available on window object`);
        }
        
        if (typeof window[className] !== 'function') {
            throw new Error(`${className} is not a constructor function`);
        }
        
        try {
            initFunction();
            console.log(`${className} initialized successfully`);
        } catch (error) {
            console.error(`Failed to initialize ${className}:`, error);
            throw new Error(`${className} initialization failed: ${error.message}`);
        }
    }

    async start() {
        try {
            console.log('🎯 [ArticleSummarizer] Starting article analysis...');
            
            // Validate components are ready
            if (!this.detector || !this.textExtractor || !this.floatingUI) {
                throw new Error('Components not properly initialized');
            }
            console.log('✅ [ArticleSummarizer] Component validation passed');

            console.log('🔍 [ArticleSummarizer] Running article detection algorithm...');
            
            // Check if article is detected
            const detection = this.detector.detectArticle();
            console.log('📈 [ArticleSummarizer] Detection result:', detection);
            
            if (!detection || !detection.hasOwnProperty('isArticle')) {
                console.error('Invalid detection result:', detection);
                return;
            }
            
            if (!detection.isArticle || detection.confidence < 50) {
                console.log(`❌ [ArticleSummarizer] Article detection failed - confidence: ${detection.confidence}%`);
                console.log('📝 [ArticleSummarizer] Page type: Non-article content');
                return;
            }
            
            console.log(`✅ [ArticleSummarizer] Article detected with ${detection.confidence}% confidence`);
            console.log('📊 [ArticleSummarizer] Article metadata:', detection.metadata);
            
            // Extract article content
            console.log('📄 [ArticleSummarizer] Starting content extraction...');
            const content = this.textExtractor.extractStructuredContent();
            console.log('📏 [ArticleSummarizer] Content extraction stats:', {
                titleLength: content.title?.length || 0,
                contentLength: content.content?.length || 0,
                headingCount: content.headings?.length || 0
            });
            
            if (!content || !content.content || content.content.length < 200) {
                console.log('Insufficient content extracted:', content?.content?.length || 0, 'characters');
                return;
            }
            
            console.log(`Extracted ${content.content.length} characters of content`);
            
            this.articleData = {
                ...content,
                metadata: {
                    ...content.metadata,
                    ...detection.metadata,
                    confidence: detection.confidence
                }
            };
            
            // Create and show floating UI
            console.log('🎨 [ArticleSummarizer] Creating floating UI interface...');
            await this.createUI();
            console.log('✅ [ArticleSummarizer] UI created successfully');
            
            // Start summarization
            console.log('🤖 [ArticleSummarizer] Starting AI summarization process...');
            await this.summarizeArticle();
            console.log('✅ [ArticleSummarizer] Summarization process completed');
            
        } catch (error) {
            console.error('💥 [ArticleSummarizer] Critical error during startup:', {
                error: error.message,
                stack: error.stack,
                url: window.location.href
            });
            this.showUserError('Failed to initialize article summarizer. Please refresh the page to try again.');
        }
    }

    showUserError(message) {
        // Simple user notification for critical errors
        console.error('User Error:', message);
        
        // Could be enhanced to show a minimal error UI
        // For now, just log to console where user can see it
    }

    async createUI() {
        const overlayElement = await this.floatingUI.create();
        if (!overlayElement) {
            throw new Error('Failed to create floating UI');
        }
        
        // Initialize chat interface
        const chatSection = overlayElement.querySelector('.chat-section');
        if (chatSection) {
            this.chatInterface = new window.ChatInterface(chatSection);
            this.chatInterface.setArticleContext(this.articleData);
        }
        
        // Setup action buttons
        this.setupActionButtons(overlayElement);
        
        this.isActive = true;
    }

    setupActionButtons(overlayElement) {
        // Copy button
        const copyBtn = overlayElement.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const summaryText = overlayElement.querySelector('.summary-text');
                if (summaryText) {
                    this.summaryRenderer.copyToClipboard(summaryText.textContent, copyBtn);
                }
            });
        }
        
        // Regenerate button
        const regenerateBtn = overlayElement.querySelector('.regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.summarizeArticle();
            });
        }
        
        // Retry button
        const retryBtn = overlayElement.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.summarizeArticle();
            });
        }
    }

    async summarizeArticle() {
        if (!this.floatingUI || !this.articleData) {
            console.warn('⚠️ [ArticleSummarizer] Summarization skipped - missing UI or article data');
            return;
        }
        
        try {
            console.log('🔄 [ArticleSummarizer] Showing loading state to user...');
            // Show loading state
            this.floatingUI.showLoading('Analyzing article...');
            
            console.log('✅ [ArticleSummarizer] Validating article data before API call...');
            // Validate article data
            this.apiClient.validateArticleData(this.articleData);
            console.log('✅ [ArticleSummarizer] Article data validation passed');
            
            console.log('🌐 [ArticleSummarizer] Sending request to AI service...');
            // Send to API
            const result = await this.apiClient.summarizeArticle(this.articleData);
            console.log('📬 [ArticleSummarizer] AI service response received:', {
                success: result.success,
                summaryLength: result.summary?.length || 0,
                hasMetadata: !!result.metadata
            });
            
            if (result.success) {
                console.log('✅ [ArticleSummarizer] Processing successful AI response...');
                // Format and display summary
                const formattedSummary = this.summaryRenderer.formatSummary(result.summary);
                const htmlContent = this.summaryRenderer.convertMarkdownToHtml(formattedSummary);
                console.log('🎨 [ArticleSummarizer] Summary formatted and converted to HTML');
                
                this.floatingUI.showSummary(htmlContent);
                console.log('✅ [ArticleSummarizer] Summary displayed to user');
                
                // Add metadata if available
                if (result.metadata) {
                    const summaryContainer = this.floatingUI.getElement()?.querySelector('.summary-text');
                    if (summaryContainer) {
                        this.summaryRenderer.addMetadata(summaryContainer, {
                            ...result.metadata,
                            confidence: this.articleData.metadata.confidence
                        });
                    }
                }
                
            } else {
                throw new Error('Failed to generate summary');
            }
            
        } catch (error) {
            console.error('Summarization failed:', error);
            this.floatingUI.showError(error.message, true);
        }
    }

    cleanup() {
        if (this.floatingUI) {
            this.floatingUI.remove();
        }
        
        if (this.chatInterface) {
            this.chatInterface.clearMessages();
        }
        
        this.isActive = false;
    }

    // Handle page navigation
    handleNavigation() {
        this.cleanup();
        // Small delay to let page settle
        setTimeout(() => this.start(), 1000);
    }
}

// Initialize the extension
let articleSummarizer = null;

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContented', () => {
        articleSummarizer = new ArticleSummarizer();
    });
} else {
    articleSummarizer = new ArticleSummarizer();
}

// Handle page navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        if (articleSummarizer) {
            articleSummarizer.handleNavigation();
        }
    }
}).observe(document, { subtree: true, childList: true });