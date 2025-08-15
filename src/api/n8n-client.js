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
            console.log('🌐 [N8NClient] Preparing summarization request...');
            const payload = {
                text: articleData.content,
                title: articleData.title || '',
                url: articleData.url || window.location.href,
                metadata: articleData.metadata || {}
            };
            
            console.log('📬 [N8NClient] Request payload:', {
                textLength: payload.text?.length || 0,
                hasTitle: !!payload.title,
                url: payload.url,
                metadataKeys: Object.keys(payload.metadata || {})
            });

            console.log('🚀 [N8NClient] Sending request to:', this.endpoints.summarize);
            const response = await this.makeRequest(this.endpoints.summarize, payload);
            console.log('📬 [N8NClient] Response received from AI service');
            
            if (response && response.summary) {
                console.log('✅ [N8NClient] Valid summary response received:', {
                    summaryLength: response.summary.length,
                    hasKeyPoints: !!(response.keyPoints && response.keyPoints.length > 0),
                    hasMetadata: !!response.metadata
                });
                return {
                    success: true,
                    summary: response.summary,
                    keyPoints: response.keyPoints || [],
                    metadata: response.metadata || {}
                };
            } else {
                console.error('❌ [N8NClient] Invalid response format:', response);
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('💥 [N8NClient] Summarization request failed:', {
                error: error.message,
                stack: error.stack,
                endpoint: this.endpoints.summarize
            });
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
        console.log('🚀 [N8NClient] Making HTTP request:', {
            endpoint,
            method: 'POST',
            payloadSize: JSON.stringify(payload).length + ' bytes',
            timeout: this.timeout + 'ms'
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn('⏰ [N8NClient] Request timeout triggered after', this.timeout + 'ms');
            controller.abort();
        }, this.timeout);

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
            console.log('📬 [N8NClient] HTTP response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('❌ [N8NClient] HTTP error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText.substring(0, 200)
                });
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ [N8NClient] Response parsed successfully:', {
                hasData: !!data,
                keys: Object.keys(data || {})
            });
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error('⏰ [N8NClient] Request aborted due to timeout');
                throw new Error('Request timed out. Please try again.');
            }
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('🌐 [N8NClient] Network error:', error.message);
                throw new Error('Network error. Please check your connection.');
            }
            
            console.error('💥 [N8NClient] Unexpected request error:', error);
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
        console.log('✅ [N8NClient] Validating article data...');
        
        if (!articleData || typeof articleData !== 'object') {
            console.error('❌ [N8NClient] Invalid article data type:', typeof articleData);
            throw new Error('Invalid article data');
        }
        
        if (!articleData.content || typeof articleData.content !== 'string') {
            console.error('❌ [N8NClient] Missing or invalid content:', typeof articleData.content);
            throw new Error('Article content is required');
        }
        
        const contentLength = articleData.content.length;
        console.log('📏 [N8NClient] Content validation:', {
            length: contentLength,
            hasTitle: !!articleData.title,
            hasMetadata: !!articleData.metadata
        });
        
        if (contentLength < 100) {
            console.error('❌ [N8NClient] Content too short:', contentLength, 'chars');
            throw new Error('Article content is too short to summarize');
        }
        
        if (contentLength > 10000) {
            console.warn('⚠️ [N8NClient] Very long content, may take extra time:', contentLength, 'chars');
        }
        
        console.log('✅ [N8NClient] Article data validation passed');
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