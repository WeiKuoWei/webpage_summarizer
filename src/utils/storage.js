class StorageManager {
    constructor() {
        this.prefix = 'article-summarizer-';
        this.isChrome = typeof chrome !== 'undefined' && chrome.storage;
    }

    async saveWindowPosition(x, y) {
        const position = { x, y };
        await this.set('window-position', position);
    }

    async loadWindowPosition() {
        const defaultPosition = { x: 20, y: 20 };
        const position = await this.get('window-position', defaultPosition);
        return position;
    }

    async saveUserPreferences(preferences) {
        await this.set('user-preferences', preferences);
    }

    async loadUserPreferences() {
        const defaultPreferences = {
            theme: 'auto', // auto, light, dark
            summaryLength: 'medium', // short, medium, long
            autoSummarize: true,
            showWelcomeMessage: true,
            minimizedOnStartup: false
        };
        
        const preferences = await this.get('user-preferences', defaultPreferences);
        return { ...defaultPreferences, ...preferences };
    }

    async saveSessionData(sessionData) {
        // Session data is temporary and should be cleared on browser close
        if (this.isChrome) {
            return chrome.storage.session?.set({
                [this.prefix + 'session-data']: sessionData
            });
        } else {
            sessionStorage.setItem(this.prefix + 'session-data', JSON.stringify(sessionData));
        }
    }

    async loadSessionData() {
        if (this.isChrome && chrome.storage.session) {
            const result = await chrome.storage.session.get(this.prefix + 'session-data');
            return result[this.prefix + 'session-data'] || {};
        } else {
            const data = sessionStorage.getItem(this.prefix + 'session-data');
            return data ? JSON.parse(data) : {};
        }
    }

    async clearSessionData() {
        if (this.isChrome && chrome.storage.session) {
            await chrome.storage.session.remove(this.prefix + 'session-data');
        } else {
            sessionStorage.removeItem(this.prefix + 'session-data');
        }
    }

    async saveChatHistory(chatHistory) {
        const limitedHistory = chatHistory.slice(-50); // Keep only last 50 messages
        await this.set('chat-history', limitedHistory);
    }

    async loadChatHistory() {
        const history = await this.get('chat-history', []);
        return history;
    }

    async clearChatHistory() {
        await this.remove('chat-history');
    }

    async saveArticleCache(url, articleData) {
        const cache = await this.get('article-cache', {});
        
        // Limit cache size
        const cacheKeys = Object.keys(cache);
        if (cacheKeys.length >= 20) {
            // Remove oldest entries
            const sortedKeys = cacheKeys.sort((a, b) => 
                cache[a].timestamp - cache[b].timestamp
            );
            const keysToRemove = sortedKeys.slice(0, 5);
            keysToRemove.forEach(key => delete cache[key]);
        }
        
        cache[url] = {
            ...articleData,
            timestamp: Date.now()
        };
        
        await this.set('article-cache', cache);
    }

    async loadArticleCache(url) {
        const cache = await this.get('article-cache', {});
        const cached = cache[url];
        
        if (!cached) return null;
        
        // Check if cache is still valid (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - cached.timestamp > maxAge) {
            delete cache[url];
            await this.set('article-cache', cache);
            return null;
        }
        
        return cached;
    }

    async clearCache() {
        await this.remove('article-cache');
    }

    async saveStatistics(stats) {
        const currentStats = await this.get('statistics', {
            articlesProcessed: 0,
            summariesGenerated: 0,
            chatMessagesExchanged: 0,
            timeSpentReading: 0,
            lastUsed: null
        });
        
        const updatedStats = {
            ...currentStats,
            ...stats,
            lastUsed: Date.now()
        };
        
        await this.set('statistics', updatedStats);
    }

    async loadStatistics() {
        return await this.get('statistics', {
            articlesProcessed: 0,
            summariesGenerated: 0,
            chatMessagesExchanged: 0,
            timeSpentReading: 0,
            lastUsed: null
        });
    }

    // Low-level storage methods
    async set(key, value) {
        const fullKey = this.prefix + key;
        
        if (this.isChrome) {
            return chrome.storage.local.set({ [fullKey]: value });
        } else {
            localStorage.setItem(fullKey, JSON.stringify(value));
            return Promise.resolve();
        }
    }

    async get(key, defaultValue = null) {
        const fullKey = this.prefix + key;
        
        if (this.isChrome) {
            const result = await chrome.storage.local.get(fullKey);
            return result[fullKey] !== undefined ? result[fullKey] : defaultValue;
        } else {
            const item = localStorage.getItem(fullKey);
            if (item !== null) {
                try {
                    return JSON.parse(item);
                } catch (error) {
                    console.warn('Failed to parse stored data:', error);
                    return defaultValue;
                }
            }
            return defaultValue;
        }
    }

    async remove(key) {
        const fullKey = this.prefix + key;
        
        if (this.isChrome) {
            return chrome.storage.local.remove(fullKey);
        } else {
            localStorage.removeItem(fullKey);
            return Promise.resolve();
        }
    }

    async clear() {
        if (this.isChrome) {
            const allKeys = await chrome.storage.local.get(null);
            const keysToRemove = Object.keys(allKeys).filter(key => 
                key.startsWith(this.prefix)
            );
            
            if (keysToRemove.length > 0) {
                return chrome.storage.local.remove(keysToRemove);
            }
        } else {
            const keysToRemove = [];
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }
        
        return Promise.resolve();
    }

    async getStorageSize() {
        if (this.isChrome) {
            const data = await chrome.storage.local.get(null);
            const ourData = Object.keys(data).filter(key => 
                key.startsWith(this.prefix)
            );
            
            let size = 0;
            ourData.forEach(key => {
                size += JSON.stringify(data[key]).length;
            });
            
            return {
                keys: ourData.length,
                bytes: size,
                kb: (size / 1024).toFixed(2)
            };
        } else {
            let size = 0;
            let keyCount = 0;
            
            for (let key in localStorage) {
                if (key.startsWith(this.prefix)) {
                    size += localStorage[key].length;
                    keyCount++;
                }
            }
            
            return {
                keys: keyCount,
                bytes: size,
                kb: (size / 1024).toFixed(2)
            };
        }
    }

    // Migration helper for version updates
    async migrate(fromVersion, toVersion) {
        console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`);
        
        // Add migration logic here as needed
        switch (toVersion) {
            case '1.1':
                // Example migration
                break;
        }
    }
}

// Create global instance
window.StorageManager = new StorageManager();