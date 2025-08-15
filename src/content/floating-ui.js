class FloatingUI {
    constructor() {
        this.overlay = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isMinimized = false;
        this.position = { x: 20, y: 20 };
        
        this.loadPosition();
    }

    async create() {
        console.log('🎨 [FloatingUI] Starting UI creation process...');
        
        if (this.overlay) {
            console.log('🔄 [FloatingUI] Removing existing overlay');
            this.remove();
        }

        try {
            // Load CSS
            console.log('🎨 [FloatingUI] Injecting CSS styles...');
            await this.injectCSS();
            console.log('✅ [FloatingUI] CSS injected successfully');
            
            // Create overlay element
            console.log('🏠 [FloatingUI] Creating overlay element...');
            await this.createOverlayElement();
            console.log('✅ [FloatingUI] Overlay element created');
            
            // Set up event listeners
            console.log('🎧 [FloatingUI] Setting up event listeners...');
            this.setupEventListeners();
            console.log('✅ [FloatingUI] Event listeners configured');
            
            // Position the overlay
            console.log('📍 [FloatingUI] Positioning overlay...');
            this.positionOverlay();
            console.log('✅ [FloatingUI] Overlay positioned');
            
            // Animate in
            console.log('✨ [FloatingUI] Starting entrance animation...');
            this.animateIn();
            
            console.log('✅ [FloatingUI] UI creation completed successfully');
            return this.overlay;
        } catch (error) {
            console.error('💥 [FloatingUI] Failed to create floating UI:', error);
            return null;
        }
    }

    async injectCSS() {
        return new Promise((resolve, reject) => {
            if (document.getElementById('article-summarizer-css')) {
                resolve();
                return;
            }

            fetch(chrome.runtime.getURL('ui/overlay.css'))
                .then(response => response.text())
                .then(css => {
                    const style = document.createElement('style');
                    style.id = 'article-summarizer-css';
                    style.textContent = css;
                    document.head.appendChild(style);
                    resolve();
                })
                .catch(reject);
        });
    }

    async createOverlayElement() {
        return new Promise((resolve, reject) => {
            fetch(chrome.runtime.getURL('ui/overlay.html'))
                .then(response => response.text())
                .then(html => {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = html;
                    this.overlay = wrapper.firstElementChild;
                    document.body.appendChild(this.overlay);
                    resolve();
                })
                .catch(reject);
        });
    }

    setupEventListeners() {
        if (!this.overlay) return;

        // Header dragging
        const header = this.overlay.querySelector('.overlay-header');
        if (header) {
            header.addEventListener('mousedown', this.handleDragStart.bind(this));
        }

        // Control buttons
        const minimizeBtn = this.overlay.querySelector('.minimize-btn');
        const closeBtn = this.overlay.querySelector('.close-btn');
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', this.minimize.bind(this));
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', this.close.bind(this));
        }

        // Global mouse events for dragging
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));

        // Click to restore from minimized state
        this.overlay.addEventListener('click', (e) => {
            if (this.isMinimized && e.target === this.overlay) {
                this.restore();
            }
        });

        // Prevent page interactions when clicking overlay
        this.overlay.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.overlay.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    }

    handleDragStart(e) {
        if (this.isMinimized) return;
        
        this.isDragging = true;
        this.overlay.style.cursor = 'grabbing';
        
        const rect = this.overlay.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        e.preventDefault();
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        
        const newX = e.clientX - this.dragOffset.x;
        const newY = e.clientY - this.dragOffset.y;
        
        // Constrain to viewport
        const constrainedPosition = this.constrainToViewport(newX, newY);
        
        this.overlay.style.left = `${constrainedPosition.x}px`;
        this.overlay.style.top = `${constrainedPosition.y}px`;
        this.overlay.style.right = 'auto';
        
        this.position = constrainedPosition;
    }

    handleDragEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            this.overlay.style.cursor = '';
            this.savePosition();
        }
    }

    constrainToViewport(x, y) {
        const rect = this.overlay.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        return {
            x: Math.max(0, Math.min(x, viewportWidth - rect.width)),
            y: Math.max(0, Math.min(y, viewportHeight - rect.height))
        };
    }

    positionOverlay() {
        if (!this.overlay) return;
        
        // Use saved position or default to top-right
        this.overlay.style.position = 'fixed';
        this.overlay.style.left = `${this.position.x}px`;
        this.overlay.style.top = `${this.position.y}px`;
        this.overlay.style.right = 'auto';
    }

    minimize() {
        if (!this.overlay || this.isMinimized) {
            console.log('⚠️ [FloatingUI] Minimize skipped - no overlay or already minimized');
            return;
        }
        
        console.log('➖ [FloatingUI] Minimizing overlay...');
        this.overlay.classList.add('minimized');
        this.isMinimized = true;
        
        // Store current position for restoration
        const rect = this.overlay.getBoundingClientRect();
        this.position = { x: rect.left, y: rect.top };
        
        console.log('✅ [FloatingUI] Overlay minimized, position saved:', this.position);
    }

    restore() {
        if (!this.overlay || !this.isMinimized) {
            console.log('⚠️ [FloatingUI] Restore skipped - no overlay or not minimized');
            return;
        }
        
        console.log('➕ [FloatingUI] Restoring overlay from minimized state...');
        this.overlay.classList.remove('minimized');
        this.isMinimized = false;
        
        // Restore position
        this.positionOverlay();
        
        console.log('✅ [FloatingUI] Overlay restored successfully');
    }

    close() {
        this.animateOut(() => {
            this.remove();
        });
    }

    remove() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.isMinimized = false;
    }

    animateIn() {
        if (!this.overlay) return;
        
        this.overlay.style.opacity = '0';
        this.overlay.style.transform = 'translateY(-20px) scale(0.95)';
        
        requestAnimationFrame(() => {
            this.overlay.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            this.overlay.style.opacity = '1';
            this.overlay.style.transform = 'translateY(0) scale(1)';
        });
    }

    animateOut(callback) {
        if (!this.overlay) {
            if (callback) callback();
            return;
        }
        
        this.overlay.style.transition = 'all 0.2s ease-out';
        this.overlay.style.opacity = '0';
        this.overlay.style.transform = 'translateY(-10px) scale(0.95)';
        
        setTimeout(() => {
            if (callback) callback();
        }, 200);
    }

    showLoading(message = 'Analyzing article...') {
        console.log('🔄 [FloatingUI] Showing loading state:', message);
        
        const loadingEl = this.overlay?.querySelector('.loading-indicator');
        const loadingText = this.overlay?.querySelector('.loading-indicator span');
        const summaryContent = this.overlay?.querySelector('.summary-content');
        const errorMessage = this.overlay?.querySelector('.error-message');
        
        if (loadingEl && loadingText) {
            loadingText.textContent = message;
            loadingEl.style.display = 'flex';
            console.log('✅ [FloatingUI] Loading indicator displayed');
        } else {
            console.warn('⚠️ [FloatingUI] Loading elements not found in DOM');
        }
        
        if (summaryContent) summaryContent.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
    }

    showSummary(summaryHtml) {
        console.log('✅ [FloatingUI] Displaying summary content:', {
            htmlLength: summaryHtml?.length || 0,
            hasContent: !!summaryHtml
        });
        
        const loadingEl = this.overlay?.querySelector('.loading-indicator');
        const summaryContent = this.overlay?.querySelector('.summary-content');
        const summaryText = this.overlay?.querySelector('.summary-text');
        const errorMessage = this.overlay?.querySelector('.error-message');
        
        if (loadingEl) {
            loadingEl.style.display = 'none';
            console.log('❌ [FloatingUI] Loading indicator hidden');
        }
        if (errorMessage) errorMessage.style.display = 'none';
        
        if (summaryText) {
            summaryText.innerHTML = summaryHtml;
            console.log('✅ [FloatingUI] Summary HTML content set');
        } else {
            console.error('❌ [FloatingUI] Summary text element not found');
        }
        
        if (summaryContent) {
            summaryContent.style.display = 'block';
            console.log('✅ [FloatingUI] Summary content section displayed');
        } else {
            console.error('❌ [FloatingUI] Summary content container not found');
        }
    }

    showError(errorText, showRetry = true) {
        console.error('❌ [FloatingUI] Displaying error state:', {
            error: errorText,
            showRetry: showRetry
        });
        
        const loadingEl = this.overlay?.querySelector('.loading-indicator');
        const summaryContent = this.overlay?.querySelector('.summary-content');
        const errorMessage = this.overlay?.querySelector('.error-message');
        const errorTextEl = this.overlay?.querySelector('.error-text');
        const retryBtn = this.overlay?.querySelector('.retry-btn');
        
        if (loadingEl) {
            loadingEl.style.display = 'none';
            console.log('❌ [FloatingUI] Loading indicator hidden');
        }
        if (summaryContent) {
            summaryContent.style.display = 'none';
            console.log('❌ [FloatingUI] Summary content hidden');
        }
        
        if (errorTextEl) {
            errorTextEl.textContent = errorText;
            console.log('✅ [FloatingUI] Error text set');
        } else {
            console.warn('⚠️ [FloatingUI] Error text element not found');
        }
        
        if (retryBtn) {
            retryBtn.style.display = showRetry ? 'inline-flex' : 'none';
            console.log('🔄 [FloatingUI] Retry button visibility:', showRetry ? 'shown' : 'hidden');
        }
        
        if (errorMessage) {
            errorMessage.style.display = 'block';
            console.log('✅ [FloatingUI] Error message displayed');
        } else {
            console.error('❌ [FloatingUI] Error message container not found');
        }
    }

    updateChatHistory(messages) {
        const chatMessages = this.overlay?.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        // Clear existing messages except welcome
        const existingMessages = chatMessages.querySelectorAll('.chat-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Add new messages
        messages.forEach(message => {
            const messageEl = this.createChatMessage(message);
            chatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    createChatMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.sender}-message`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = message.text;
        
        messageEl.appendChild(bubble);
        return messageEl;
    }

    getElement() {
        return this.overlay;
    }

    isVisible() {
        return this.overlay && document.body.contains(this.overlay);
    }

    savePosition() {
        if (this.position) {
            localStorage.setItem('article-summarizer-position', JSON.stringify(this.position));
        }
    }

    loadPosition() {
        try {
            const saved = localStorage.getItem('article-summarizer-position');
            if (saved) {
                this.position = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load saved position:', error);
        }
    }
}

window.FloatingUI = FloatingUI;