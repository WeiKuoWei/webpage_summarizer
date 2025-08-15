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
        const confidence = this.calculateConfidence();
        const isArticle = confidence >= 70;
        
        return {
            isArticle,
            confidence,
            metadata: this.extractMetadata()
        };
    }

    calculateConfidence() {
        let score = 0;
        
        // Check for article-specific HTML elements
        score += this.checkArticleElements() * 30;
        
        // Check content structure
        score += this.checkContentStructure() * 25;
        
        // Check metadata presence
        score += this.checkMetadata() * 20;
        
        // Check text patterns
        score += this.checkTextPatterns() * 15;
        
        // Check for navigation elements (negative score)
        score -= this.checkNavigationElements() * 10;
        
        return Math.max(0, Math.min(100, score));
    }

    checkArticleElements() {
        for (const selector of this.articleSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                const hasSignificantContent = Array.from(elements).some(el => 
                    el.textContent.trim().length > 500
                );
                if (hasSignificantContent) return 1;
            }
        }
        return 0;
    }

    checkContentStructure() {
        const paragraphs = document.querySelectorAll('p');
        const significantParagraphs = Array.from(paragraphs).filter(p => 
            p.textContent.trim().length > 50
        );
        
        if (significantParagraphs.length >= this.minParagraphCount) {
            const totalWords = significantParagraphs.reduce((count, p) => 
                count + p.textContent.trim().split(/\s+/).length, 0
            );
            
            if (totalWords >= this.minWordCount) {
                return 1;
            }
        }
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
        return {
            title: this.extractTitle(),
            author: this.extractAuthor(),
            publishDate: this.extractPublishDate(),
            url: window.location.href
        };
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