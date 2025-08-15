class SummaryRenderer {
    constructor() {
        this.markdownPatterns = [
            { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
            { pattern: /`(.*?)`/g, replacement: '<code>$1</code>' },
            { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
            { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
            { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
            { pattern: /^\* (.*$)/gim, replacement: '<li>$1</li>' },
            { pattern: /^\- (.*$)/gim, replacement: '<li>$1</li>' },
            { pattern: /^\d+\. (.*$)/gim, replacement: '<li>$1</li>' }
        ];
    }

    renderSummary(summaryText, container) {
        try {
            console.log('🎨 [SummaryRenderer] Rendering summary:', {
                textLength: summaryText?.length || 0,
                hasContainer: !!container
            });
            
            const htmlContent = this.convertMarkdownToHtml(summaryText);
            container.innerHTML = htmlContent;
            this.setupCopyButton(container);
            
            console.log('✅ [SummaryRenderer] Summary rendered successfully');
            return true;
        } catch (error) {
            console.error('💥 [SummaryRenderer] Failed to render summary:', error);
            container.innerHTML = '<p>Error displaying summary</p>';
            return false;
        }
    }

    convertMarkdownToHtml(markdown) {
        console.log('🔄 [SummaryRenderer] Converting markdown to HTML...');
        let html = markdown;
        
        // Apply markdown conversions
        console.log('⚙️ [SummaryRenderer] Applying markdown patterns...');
        this.markdownPatterns.forEach(({ pattern, replacement }) => {
            const matches = html.match(pattern);
            if (matches) {
                console.log(`  ✅ Pattern matched: ${pattern} (${matches.length} times)`);
            }
            html = html.replace(pattern, replacement);
        });
        
        // Handle line breaks and paragraphs
        console.log('📏 [SummaryRenderer] Processing paragraphs...');
        html = this.processParagraphs(html);
        
        // Handle lists
        console.log('📝 [SummaryRenderer] Processing lists...');
        html = this.processLists(html);
        
        // Clean up extra whitespace
        html = html.replace(/\n\s*\n/g, '\n').trim();
        
        console.log('✅ [SummaryRenderer] Markdown conversion complete, HTML length:', html.length);
        return html;
    }

    processParagraphs(html) {
        // Split by double line breaks to create paragraphs
        const paragraphs = html.split(/\n\s*\n/);
        
        return paragraphs
            .map(para => {
                para = para.trim();
                if (!para) return '';
                
                // Don't wrap if it's already a heading or list item
                if (para.match(/^<(h[1-6]|li)/i)) {
                    return para;
                }
                
                return `<p>${para}</p>`;
            })
            .filter(para => para.length > 0)
            .join('\n');
    }

    processLists(html) {
        // Wrap consecutive <li> elements in <ul>
        html = html.replace(/(<li>.*?<\/li>\s*)+/gs, match => {
            const listItems = match.trim();
            
            // Check if it looks like a numbered list
            const isNumbered = listItems.includes('1.') || listItems.includes('2.');
            const tag = isNumbered ? 'ol' : 'ul';
            
            return `<${tag}>\n${listItems}\n</${tag}>`;
        });
        
        return html;
    }

    setupCopyButton(container) {
        const copyBtn = container.parentElement?.querySelector('.copy-btn');
        if (!copyBtn) return;
        
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(container.textContent, copyBtn);
        });
    }

    async copyToClipboard(text, buttonElement) {
        console.log('📋 [SummaryRenderer] Attempting to copy text to clipboard:', {
            textLength: text?.length || 0,
            hasButton: !!buttonElement
        });
        
        try {
            await navigator.clipboard.writeText(text);
            console.log('✅ [SummaryRenderer] Text copied to clipboard successfully');
            this.showCopySuccess(buttonElement);
        } catch (error) {
            console.warn('⚠️ [SummaryRenderer] Clipboard API failed, using fallback:', error.message);
            // Fallback for older browsers
            this.fallbackCopyToClipboard(text, buttonElement);
        }
    }

    fallbackCopyToClipboard(text, buttonElement) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(buttonElement);
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showCopyError(buttonElement);
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess(buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '✓ Copied!';
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove('copied');
        }, 2000);
    }

    showCopyError(buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '✗ Failed';
        buttonElement.style.color = '#dc3545';
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.color = '';
        }, 2000);
    }

    formatSummary(rawSummary) {
        console.log('⚙️ [SummaryRenderer] Formatting AI summary:', {
            originalLength: rawSummary?.length || 0,
            hasPrefix: /^Summary:\s*/i.test(rawSummary || '')
        });
        
        // Clean up common formatting issues from AI responses
        let formatted = rawSummary.trim();
        
        // Remove "Summary:" prefix if present
        if (/^Summary:\s*/i.test(formatted)) {
            console.log('  ✂️ Removing "Summary:" prefix');
            formatted = formatted.replace(/^Summary:\s*/i, '');
        }
        
        // Ensure proper spacing around list items
        formatted = formatted.replace(/([^\n])\n\*/g, '$1\n\n*');
        formatted = formatted.replace(/([^\n])\n-/g, '$1\n\n-');
        
        // Ensure proper spacing around headings
        formatted = formatted.replace(/([^\n])\n#/g, '$1\n\n#');
        
        console.log('✅ [SummaryRenderer] Summary formatting complete:', {
            formattedLength: formatted.length
        });
        
        return formatted;
    }

    createKeyPointsList(keyPoints) {
        if (!Array.isArray(keyPoints)) return '';
        
        const listItems = keyPoints
            .filter(point => point && point.trim())
            .map(point => `* ${point.trim()}`)
            .join('\n');
        
        return listItems;
    }

    estimateReadingTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes;
    }

    addMetadata(container, metadata) {
        if (!metadata) return;
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'summary-metadata';
        metaDiv.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e1e5e9;
        `;
        
        const metaItems = [];
        
        if (metadata.wordCount) {
            metaItems.push(`${metadata.wordCount} words`);
        }
        
        if (metadata.readTime) {
            metaItems.push(`~${metadata.readTime} min read`);
        }
        
        if (metadata.confidence) {
            metaItems.push(`${Math.round(metadata.confidence)}% confidence`);
        }
        
        if (metaItems.length > 0) {
            metaDiv.textContent = metaItems.join(' • ');
            container.appendChild(metaDiv);
        }
    }

    highlightKeyTerms(container, terms) {
        if (!terms || !Array.isArray(terms)) return;
        
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            let text = textNode.textContent;
            let hasChanges = false;
            
            terms.forEach(term => {
                const regex = new RegExp(`\\b(${term})\\b`, 'gi');
                if (regex.test(text)) {
                    text = text.replace(regex, '<mark>$1</mark>');
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = text;
                textNode.parentNode.replaceChild(wrapper, textNode);
            }
        });
    }

    sanitizeHtml(html) {
        // Basic HTML sanitization - only allow safe tags
        const allowedTags = ['p', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'code', 'mark'];
        const allowedAttributes = [];
        
        // Remove script tags and other dangerous elements
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
        html = html.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
        
        return html;
    }
}

window.SummaryRenderer = SummaryRenderer;