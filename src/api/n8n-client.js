class N8NClient {
    constructor() {
        this.baseUrl = 'https://piccollage-ops.app.n8n.cloud/webhook';
        this.endpoints = {
            summarize: `${this.baseUrl}/summarize`,
            chat: `${this.baseUrl}/chat` // You may need to create this endpoint
        };
        this.timeout = 30000; // 30 seconds
    }

    async summarizeArticle(articleData) {
        try {
            const payload = {
                text: articleData.content,
                title: articleData.title || '',
                url: articleData.url || window.location.href,
                metadata: articleData.metadata || {}
            };

            const response = await this.makeRequest(this.endpoints.summarize, payload);
            
            if (response && response.summary) {
                return {
                    success: true,
                    summary: response.summary,
                    keyPoints: response.keyPoints || [],
                    metadata: response.metadata || {}
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Summarization failed:', error);
            throw new Error(this.getErrorMessage(error));
        }
    }

    async sendChatMessage(chatData) {
        try {
            const payload = {
                message: chatData.message,
                context: chatData.context || '',
                title: chatData.title || '',
                conversation_history: chatData.conversation_history || []
            };

            // If chat endpoint doesn't exist yet, use summarize endpoint as fallback
            const endpoint = this.endpoints.chat || this.endpoints.summarize;
            const response = await this.makeRequest(endpoint, {
                ...payload,
                type: 'chat' // Help n8n distinguish between requests
            });
            
            if (response && (response.response || response.answer || response.summary)) {
                return response.response || response.answer || response.summary;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Chat request failed:', error);
            throw new Error(this.getErrorMessage(error));
        }
    }

    async makeRequest(endpoint, payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection.');
            }
            
            throw error;
        }
    }

    getErrorMessage(error) {
        if (error.message.includes('timeout')) {
            return 'The request took too long. Please try again.';
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        
        if (error.message.includes('404')) {
            return 'AI service not found. Please contact support.';
        }
        
        if (error.message.includes('500')) {
            return 'AI service is temporarily unavailable. Please try again later.';
        }
        
        if (error.message.includes('429')) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        
        return 'An unexpected error occurred. Please try again.';
    }

    async testConnection() {
        try {
            const testPayload = {
                text: 'This is a test message to verify the connection.',
                test: true
            };
            
            await this.makeRequest(this.endpoints.summarize, testPayload);
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    setEndpoint(type, url) {
        if (this.endpoints.hasOwnProperty(type)) {
            this.endpoints[type] = url;
        }
    }

    setTimeout(ms) {
        this.timeout = Math.max(5000, Math.min(60000, ms)); // Between 5s and 60s
    }

    // Utility method to validate article data before sending
    validateArticleData(articleData) {
        if (!articleData || typeof articleData !== 'object') {
            throw new Error('Invalid article data');
        }
        
        if (!articleData.content || typeof articleData.content !== 'string') {
            throw new Error('Article content is required');
        }
        
        if (articleData.content.length < 100) {
            throw new Error('Article content is too short to summarize');
        }
        
        if (articleData.content.length > 10000) {
            console.warn('Article content is very long, may take extra time to process');
        }
        
        return true;
    }

    // Utility method to validate chat data before sending
    validateChatData(chatData) {
        if (!chatData || typeof chatData !== 'object') {
            throw new Error('Invalid chat data');
        }
        
        if (!chatData.message || typeof chatData.message !== 'string') {
            throw new Error('Message is required');
        }
        
        if (chatData.message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        
        if (chatData.message.length > 500) {
            throw new Error('Message is too long (max 500 characters)');
        }
        
        return true;
    }
}

// Create global instance
window.N8NClient = new N8NClient();