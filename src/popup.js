document.addEventListener('DOMContentLoaded', function() {
    const summarizeBtn = document.getElementById('summarize');
    const summaryDiv = document.getElementById('summary');
    
    // Replace with your n8n webhook URL
    const N8N_WEBHOOK_URL = 'https://piccollage-ops.app.n8n.cloud/webhook/summarize';
    
    summarizeBtn.addEventListener('click', async function() {
        try {
            // Show loading
            summaryDiv.style.display = 'block';
            summaryDiv.innerHTML = '<div class="loading">Summarizing...</div>';
            
            // Get active tab
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            // Extract article text from the page
            const results = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: extractArticleText
            });
            
            const articleText = results[0].result;
            
            if (!articleText || articleText.length < 100) {
                throw new Error('No article content found');
            }
            
            // Send to n8n workflow
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: articleText
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get summary');
            }
            
            const data = await response.json();
            summaryDiv.innerHTML = `<strong>Summary:</strong><br>${data.summary}`;
            
        } catch (error) {
            summaryDiv.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    });
});

// Function to extract article text (runs in page context)
function extractArticleText() {
    // Try common article selectors
    const selectors = [
        'article',
        '[role="main"] p',
        '.post-content p',
        '.entry-content p',
        '.content p',
        'main p',
        '.article-body p'
    ];
    
    let text = '';
    
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            text = Array.from(elements)
                .map(el => el.textContent)
                .join(' ')
                .trim();
            if (text.length > 200) break;
        }
    }
    
    // Fallback: get all paragraph text
    if (text.length < 200) {
        const paragraphs = document.querySelectorAll('p');
        text = Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(t => t.length > 50)
            .join(' ');
    }
    
    // Clean up text
    return text.replace(/\s+/g, ' ').trim().substring(0, 3000);
}