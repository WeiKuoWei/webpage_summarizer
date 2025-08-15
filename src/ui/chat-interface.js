class ChatInterface {
    constructor(containerElement) {
        this.container = containerElement;
        this.messages = [];
        this.isProcessing = false;
        this.articleContext = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const input = this.container.querySelector('.chat-input');
        const sendBtn = this.container.querySelector('.send-btn');
        
        if (input) {
            input.addEventListener('input', () => {
                this.updateSendButton();
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    setArticleContext(context) {
        this.articleContext = context;
    }

    updateSendButton() {
        const input = this.container.querySelector('.chat-input');
        const sendBtn = this.container.querySelector('.send-btn');
        
        if (input && sendBtn) {
            const hasText = input.value.trim().length > 0;
            sendBtn.disabled = !hasText || this.isProcessing;
        }
    }

    async sendMessage() {
        const input = this.container.querySelector('.chat-input');
        if (!input || this.isProcessing) return;
        
        const messageText = input.value.trim();
        if (!messageText) return;
        
        // Add user message
        this.addMessage({
            sender: 'user',
            text: messageText,
            timestamp: new Date()
        });
        
        // Clear input
        input.value = '';
        this.updateSendButton();
        
        // Set processing state
        this.setProcessing(true);
        
        try {
            // Send to API
            const response = await this.sendToAPI(messageText);
            
            // Add AI response
            this.addMessage({
                sender: 'ai',
                text: response,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Chat API error:', error);
            this.addMessage({
                sender: 'ai',
                text: 'Sorry, I encountered an error while processing your question. Please try again.',
                timestamp: new Date(),
                isError: true
            });
        } finally {
            this.setProcessing(false);
        }
    }

    async sendToAPI(message) {
        const apiClient = window.N8NClient;
        if (!apiClient) {
            throw new Error('API client not available');
        }
        
        const payload = {
            message: message,
            context: this.articleContext?.content || '',
            title: this.articleContext?.title || '',
            conversation_history: this.getConversationHistory()
        };
        
        return await apiClient.sendChatMessage(payload);
    }

    getConversationHistory() {
        return this.messages
            .filter(msg => !msg.isError)
            .slice(-10) // Keep last 10 messages for context
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.sender}-message`;
        
        if (message.isError) {
            messageEl.classList.add('error-message');
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        // Handle markdown in AI messages
        if (message.sender === 'ai' && !message.isError) {
            bubble.innerHTML = this.formatAIResponse(message.text);
        } else {
            bubble.textContent = message.text;
        }
        
        messageEl.appendChild(bubble);
        
        // Add timestamp if needed
        if (this.shouldShowTimestamp(message)) {
            const timestamp = document.createElement('div');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = this.formatTimestamp(message.timestamp);
            messageEl.appendChild(timestamp);
        }
        
        messagesContainer.appendChild(messageEl);
    }

    formatAIResponse(text) {
        // Basic markdown support for AI responses
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    shouldShowTimestamp(message) {
        const lastMessage = this.messages[this.messages.length - 2];
        if (!lastMessage) return false;
        
        const timeDiff = message.timestamp - lastMessage.timestamp;
        return timeDiff > 5 * 60 * 1000; // Show if more than 5 minutes apart
    }

    formatTimestamp(timestamp) {
        return timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    setProcessing(processing) {
        this.isProcessing = processing;
        this.updateSendButton();
        
        const input = this.container.querySelector('.chat-input');
        if (input) {
            input.disabled = processing;
            input.placeholder = processing ? 
                'AI is thinking...' : 
                'Ask a question about the article...';
        }
        
        if (processing) {
            this.showTypingIndicator();
        } else {
            this.hideTypingIndicator();
        }
    }

    showTypingIndicator() {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (!messagesContainer) return;
        
        // Remove existing typing indicator
        const existingIndicator = messagesContainer.querySelector('.typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'chat-message ai-message typing-indicator';
        indicator.innerHTML = `
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // Add CSS for typing animation
        this.addTypingCSS();
        
        messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = this.container.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    addTypingCSS() {
        if (document.getElementById('chat-typing-css')) return;
        
        const style = document.createElement('style');
        style.id = 'chat-typing-css';
        style.textContent = `
            .typing-dots {
                display: flex;
                gap: 2px;
                align-items: center;
            }
            
            .typing-dots span {
                width: 4px;
                height: 4px;
                background: #666;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0%, 60%, 100% {
                    transform: scale(0.8);
                    opacity: 0.5;
                }
                30% {
                    transform: scale(1.2);
                    opacity: 1;
                }
            }
            
            .message-timestamp {
                font-size: 11px;
                color: #999;
                text-align: center;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    scrollToBottom() {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    clearMessages() {
        this.messages = [];
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer) {
            // Keep only the welcome message
            const welcomeMessage = messagesContainer.querySelector('.welcome-message');
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                messagesContainer.appendChild(welcomeMessage);
            }
        }
    }

    addWelcomeMessage() {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (!messagesContainer || messagesContainer.querySelector('.welcome-message')) {
            return;
        }
        
        const welcomeEl = document.createElement('div');
        welcomeEl.className = 'welcome-message';
        welcomeEl.innerHTML = `
            <p>I've read the article and can answer questions about it. What would you like to know?</p>
        `;
        
        messagesContainer.insertBefore(welcomeEl, messagesContainer.firstChild);
    }

    getSuggestedQuestions() {
        if (!this.articleContext) return [];
        
        const suggestions = [
            "What are the main points?",
            "Can you explain this in simpler terms?",
            "What are the implications?",
            "Are there any important details I should know?"
        ];
        
        return suggestions;
    }

    showSuggestedQuestions() {
        const suggestions = this.getSuggestedQuestions();
        if (suggestions.length === 0) return;
        
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (!messagesContainer) return;
        
        const suggestionsEl = document.createElement('div');
        suggestionsEl.className = 'suggested-questions';
        suggestionsEl.innerHTML = `
            <div class="suggestions-header">Try asking:</div>
            ${suggestions.map(q => `
                <button class="suggestion-btn" data-question="${q}">${q}</button>
            `).join('')}
        `;
        
        // Add click handlers
        suggestionsEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                const question = e.target.dataset.question;
                const input = this.container.querySelector('.chat-input');
                if (input) {
                    input.value = question;
                    this.updateSendButton();
                }
                suggestionsEl.remove();
            }
        });
        
        messagesContainer.appendChild(suggestionsEl);
        this.scrollToBottom();
    }
}

window.ChatInterface = ChatInterface;