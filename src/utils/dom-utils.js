class DOMUtils {
    static createElement(tagName, options = {}) {
        const element = document.createElement(tagName);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.styles) {
            Object.entries(options.styles).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }
        
        return element;
    }

    static findElement(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error('Invalid selector:', selector, error);
            return null;
        }
    }

    static findElements(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.error('Invalid selector:', selector, error);
            return [];
        }
    }

    static addEventListeners(element, events) {
        Object.entries(events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }

    static removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            return true;
        }
        return false;
    }

    static insertAfter(newElement, referenceElement) {
        if (referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
        }
    }

    static insertBefore(newElement, referenceElement) {
        if (referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement);
        }
    }

    static isVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }

    static getTextContent(element, options = {}) {
        if (!element) return '';
        
        const {
            excludeSelectors = [],
            includeHidden = false,
            maxLength = null
        } = options;
        
        // Clone element to avoid modifying original
        const clone = element.cloneNode(true);
        
        // Remove excluded elements
        excludeSelectors.forEach(selector => {
            const excludedElements = clone.querySelectorAll(selector);
            excludedElements.forEach(el => el.remove());
        });
        
        // Filter hidden elements if needed
        if (!includeHidden) {
            const walker = document.createTreeWalker(
                clone,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: (node) => {
                        const style = window.getComputedStyle(node);
                        return (style.display === 'none' || style.visibility === 'hidden') 
                            ? NodeFilter.FILTER_REJECT 
                            : NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            
            const hiddenElements = [];
            let node;
            while (node = walker.nextNode()) {
                hiddenElements.push(node);
            }
            
            hiddenElements.forEach(el => el.remove());
        }
        
        let text = clone.textContent || clone.innerText || '';
        text = text.replace(/\s+/g, ' ').trim();
        
        if (maxLength && text.length > maxLength) {
            text = text.substring(0, maxLength) + '...';
        }
        
        return text;
    }

    static hasClass(element, className) {
        return element && element.classList && element.classList.contains(className);
    }

    static addClass(element, className) {
        if (element && element.classList) {
            element.classList.add(className);
        }
    }

    static removeClass(element, className) {
        if (element && element.classList) {
            element.classList.remove(className);
        }
    }

    static toggleClass(element, className) {
        if (element && element.classList) {
            element.classList.toggle(className);
        }
    }

    static getElementPosition(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    }

    static isElementInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    static scrollToElement(element, options = {}) {
        if (!element) return;
        
        const {
            behavior = 'smooth',
            block = 'center',
            inline = 'nearest'
        } = options;
        
        element.scrollIntoView({
            behavior,
            block,
            inline
        });
    }

    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static waitForElement(selector, timeout = 5000, context = document) {
        return new Promise((resolve, reject) => {
            const element = context.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations) => {
                const element = context.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(context, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    static sanitizeHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = html;
        return tempDiv.innerHTML;
    }
}

window.DOMUtils = DOMUtils;