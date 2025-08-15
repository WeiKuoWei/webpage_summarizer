class TextExtractor {
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
        
        this.excludeSelectors = [
            'nav',
            '.navigation',
            '.menu',
            '.sidebar',
            '.comments',
            '.comment',
            '.advertisement',
            '.ad',
            '.social',
            '.share',
            '.related',
            '.footer',
            '.header',
            'script',
            'style',
            '.cookie-banner'
        ];
        
        this.maxLength = 5000;
    }

    extractText() {
        try {
            // Try primary extraction methods
            let text = this.extractFromArticleElements() || 
                      this.extractFromMainContent() || 
                      this.extractFromParagraphs();
            
            if (!text || text.length < 200) {
                throw new Error('Insufficient content found');
            }
            
            return this.cleanText(text);
        } catch (error) {
            console.error('Text extraction failed:', error);
            return null;
        }
    }

    extractFromArticleElements() {
        for (const selector of this.articleSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = this.getCleanTextFromElement(element);
                if (text && text.length > 300) {
                    return text;
                }
            }
        }
        return null;
    }

    extractFromMainContent() {
        // Look for the main content area
        const contentContainers = document.querySelectorAll(
            'div[class*="content"], div[class*="article"], div[class*="post"]'
        );
        
        for (const container of contentContainers) {
            const paragraphs = container.querySelectorAll('p');
            if (paragraphs.length >= 3) {
                const text = this.extractTextFromParagraphs(paragraphs);
                if (text && text.length > 300) {
                    return text;
                }
            }
        }
        return null;
    }

    extractFromParagraphs() {
        const allParagraphs = document.querySelectorAll('p');
        const filteredParagraphs = Array.from(allParagraphs).filter(p => {
            // Filter out paragraphs in excluded sections
            return !this.isInExcludedSection(p) && 
                   p.textContent.trim().length > 30;
        });
        
        if (filteredParagraphs.length >= 3) {
            return this.extractTextFromParagraphs(filteredParagraphs);
        }
        return null;
    }

    getCleanTextFromElement(element) {
        // Clone the element to avoid modifying the original
        const clone = element.cloneNode(true);
        
        // Remove excluded elements
        this.excludeSelectors.forEach(selector => {
            const excludedElements = clone.querySelectorAll(selector);
            excludedElements.forEach(el => el.remove());
        });
        
        // Extract text from paragraphs and headers
        const textElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote');
        const textParts = Array.from(textElements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 10);
        
        return textParts.join('\n\n');
    }

    extractTextFromParagraphs(paragraphs) {
        return Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(text => text.length > 20)
            .join('\n\n');
    }

    isInExcludedSection(element) {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            for (const selector of this.excludeSelectors) {
                if (parent.matches(selector) || 
                    parent.classList.toString().toLowerCase().includes(selector.replace('.', ''))) {
                    return true;
                }
            }
            parent = parent.parentElement;
        }
        return false;
    }

    cleanText(text) {
        return text
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove excessive line breaks
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Remove leading/trailing whitespace
            .trim()
            // Limit length
            .substring(0, this.maxLength);
    }

    extractStructuredContent() {
        const content = {
            title: this.extractTitle(),
            subtitle: this.extractSubtitle(),
            content: this.extractText(),
            headings: this.extractHeadings(),
            metadata: this.extractMetadata()
        };
        
        return content;
    }

    extractTitle() {
        const titleSelectors = [
            'h1',
            '.title',
            '.headline',
            '.article-title',
            '.post-title'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 5) {
                return element.textContent.trim();
            }
        }
        
        return document.title || '';
    }

    extractSubtitle() {
        const subtitleSelectors = [
            '.subtitle',
            '.subheading',
            '.article-subtitle',
            'h2:first-of-type'
        ];
        
        for (const selector of subtitleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 5) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }

    extractHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings)
            .map(h => ({
                level: parseInt(h.tagName.substring(1)),
                text: h.textContent.trim()
            }))
            .filter(h => h.text.length > 0);
    }

    extractMetadata() {
        return {
            wordCount: this.countWords(this.extractText() || ''),
            estimatedReadTime: this.calculateReadTime(this.extractText() || ''),
            language: document.documentElement.lang || 'en'
        };
    }

    countWords(text) {
        return text.trim().split(/\s+/).length;
    }

    calculateReadTime(text) {
        const wordsPerMinute = 200;
        const words = this.countWords(text);
        return Math.ceil(words / wordsPerMinute);
    }
}

window.TextExtractor = TextExtractor;