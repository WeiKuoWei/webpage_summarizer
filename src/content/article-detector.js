class ArticleDetector {
    constructor() {
        this.articleSelectors = [
            'article',
            '[role="main"]',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.content',
            'main',
            '.article-body',
            '.post-body'
        ];
        
        this.minWordCount = 300;
        this.minParagraphCount = 3;
    }

    detectArticle() {
        console.log('🔍 [ArticleDetector] Starting article detection analysis...');
        const confidence = this.calculateConfidence();
        const isArticle = confidence >= 50;
        const metadata = this.extractMetadata();
        
        console.log('📋 [ArticleDetector] Detection complete:', {
            isArticle,
            confidence: `${confidence}%`,
            title: metadata.title?.substring(0, 50) + '...',
            author: metadata.author,
            url: metadata.url
        });
        
        return {
            isArticle,
            confidence,
            metadata
        };
    }

    calculateConfidence() {
        let score = 0;
        
        // Check for article-specific HTML elements
        const articleElementsScore = this.checkArticleElements() * 30;
        score += articleElementsScore;
        console.log('🏠 [ArticleDetector] Article elements score:', articleElementsScore.toFixed(1));
        
        // Check content structure
        const contentStructureScore = this.checkContentStructure() * 25;
        score += contentStructureScore;
        console.log('📏 [ArticleDetector] Content structure score:', contentStructureScore.toFixed(1));
        
        // Check metadata presence
        const metadataScore = this.checkMetadata() * 20;
        score += metadataScore;
        console.log('🏷️ [ArticleDetector] Metadata score:', metadataScore.toFixed(1));
        
        // Check text patterns
        const textPatternsScore = this.checkTextPatterns() * 15;
        score += textPatternsScore;
        console.log('📝 [ArticleDetector] Text patterns score:', textPatternsScore.toFixed(1));
        
        // Check for navigation elements (negative score)
        const navPenalty = this.checkNavigationElements() * 10;
        score -= navPenalty;
        console.log('🧠 [ArticleDetector] Navigation penalty:', navPenalty.toFixed(1));
        
        const finalScore = Math.max(0, Math.min(100, score));
        console.log('🏆 [ArticleDetector] Final confidence score:', finalScore.toFixed(1));
        return finalScore;
    }

    checkArticleElements() {
        console.log('🗓️ [ArticleDetector] Checking for semantic article elements...');
        for (const selector of this.articleSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                const hasSignificantContent = Array.from(elements).some(el => {
                    const contentLength = el.textContent.trim().length;
                    console.log(`  🔍 Found ${selector}: ${contentLength} chars`);
                    return contentLength > 500;
                });
                if (hasSignificantContent) {
                    console.log(`  ✅ Significant content found in ${selector}`);
                    return 1;
                }
            }
        }
        console.log('  ❌ No semantic article elements with significant content');
        return 0;
    }

    checkContentStructure() {
        console.log('📊 [ArticleDetector] Analyzing content structure...');
        const paragraphs = document.querySelectorAll('p');
        const significantParagraphs = Array.from(paragraphs).filter(p => 
            p.textContent.trim().length > 50
        );
        
        console.log(`  📄 Total paragraphs: ${paragraphs.length}`);
        console.log(`  ✅ Significant paragraphs: ${significantParagraphs.length}`);
        
        if (significantParagraphs.length >= this.minParagraphCount) {
            const totalWords = significantParagraphs.reduce((count, p) => 
                count + p.textContent.trim().split(/\s+/).length, 0
            );
            
            console.log(`  📈 Total words: ${totalWords} (min: ${this.minWordCount})`);
            
            if (totalWords >= this.minWordCount) {
                console.log('  ✅ Content structure requirements met');
                return 1;
            }
        }
        console.log('  ❌ Insufficient content structure');
        return 0;
    }

    checkMetadata() {
        let score = 0;
        
        // Check for title
        const title = document.querySelector('h1, .title, .headline, [class*="title"]');
        if (title && title.textContent.trim().length > 10) score += 0.3;
        
        // Check for author
        const author = document.querySelector('[class*="author"], [class*="byline"], .by-author');
        if (author) score += 0.2;
        
        // Check for publish date
        const date = document.querySelector('time, [class*="date"], [class*="published"]');
        if (date) score += 0.2;
        
        // Check for article schema
        const schema = document.querySelector('[itemtype*="Article"]');
        if (schema) score += 0.3;
        
        return score;
    }

    checkTextPatterns() {
        const bodyText = document.body.textContent;
        const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        if (sentences.length >= 10) {
            const avgSentenceLength = sentences.reduce((sum, s) => 
                sum + s.trim().split(/\s+/).length, 0
            ) / sentences.length;
            
            // Good article sentences are typically 15-25 words
            if (avgSentenceLength >= 12 && avgSentenceLength <= 30) {
                return 1;
            }
        }
        return 0;
    }

    checkNavigationElements() {
        const navElements = document.querySelectorAll('nav, .menu, .navigation, .sidebar');
        const navText = Array.from(navElements).reduce((text, el) => 
            text + el.textContent, ''
        );
        
        const totalText = document.body.textContent;
        const navRatio = navText.length / totalText.length;
        
        // If navigation takes up more than 30% of content, likely not an article
        return navRatio > 0.3 ? 1 : 0;
    }

    extractMetadata() {
        console.log('🏷️ [ArticleDetector] Extracting page metadata...');
        const metadata = {
            title: this.extractTitle(),
            author: this.extractAuthor(),
            publishDate: this.extractPublishDate(),
            url: window.location.href
        };
        console.log('📋 [ArticleDetector] Metadata extracted:', {
            hasTitle: !!metadata.title,
            hasAuthor: !!metadata.author,
            hasDate: !!metadata.publishDate,
            titlePreview: metadata.title?.substring(0, 50)
        });
        return metadata;
    }

    extractTitle() {
        const selectors = [
            'h1',
            '.title',
            '.headline', 
            '.article-title',
            '.post-title',
            '[class*="title"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 5) {
                return element.textContent.trim();
            }
        }
        
        return document.title || '';
    }

    extractAuthor() {
        const selectors = [
            '[class*="author"]',
            '[class*="byline"]',
            '.by-author',
            '[rel="author"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }

    extractPublishDate() {
        const timeElement = document.querySelector('time[datetime]');
        if (timeElement) {
            return timeElement.getAttribute('datetime');
        }
        
        const dateSelectors = [
            '[class*="date"]',
            '[class*="published"]',
            '.timestamp'
        ];
        
        for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }
}

window.ArticleDetector = ArticleDetector;