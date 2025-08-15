# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome browser extension called "Article Summarizer" that uses AI to summarize web articles. The extension automatically detects articles on web pages, displays a floating overlay with AI-generated summaries, and provides an interactive chat interface for asking questions about the content.

## Architecture

The extension follows Chrome Manifest V3 standards with a modular architecture:

### Core Components

- **manifest.json**: Extension configuration with `activeTab` and `scripting` permissions
- **content.js**: Main coordinator that initializes all modules and handles the article detection workflow
- **popup.html/popup.js**: Fallback UI interface accessible via extension icon

### Modular Structure

- **content/**: Core detection and extraction modules
  - `article-detector.js`: Smart article detection with confidence scoring
  - `text-extractor.js`: Intelligent text extraction from various article layouts
  - `floating-ui.js`: Draggable floating overlay management

- **ui/**: User interface components
  - `overlay.html`: HTML structure for the floating interface
  - `overlay.css`: Comprehensive styling with dark/light mode support
  - `summary-renderer.js`: Markdown to HTML conversion and copy functionality
  - `chat-interface.js`: Interactive chat system with typing indicators

- **api/**: External service integration
  - `n8n-client.js`: Communication with n8n webhook service

- **utils/**: Helper utilities
  - `dom-utils.js`: DOM manipulation and utility functions
  - `storage.js`: Chrome storage API wrapper for preferences and caching

## Current Implementation

### Article Detection Algorithm
The system uses a confidence-based scoring system (0-100%) that evaluates:
- HTML semantic elements (`<article>`, `[role="main"]`)
- Content structure (paragraph count, word count)
- Metadata presence (author, publish date, schema)
- Text patterns and readability metrics

Minimum confidence threshold: 50%

### Text Extraction Strategy
Multi-layer extraction approach:
1. Primary: Semantic HTML elements
2. Secondary: Content container analysis  
3. Fallback: Paragraph filtering with exclusion rules
4. Content limit: 5000 characters
5. Exclusion filters for navigation, ads, comments

### Floating UI System
- Draggable positioning with viewport constraints
- Minimize/restore functionality
- Position persistence via localStorage
- Smooth animations and transitions
- Z-index management for proper layering

## Key Functions

### Article Detection
**ArticleDetector.detectArticle()**: Returns object with:
- `isArticle`: boolean
- `confidence`: 0-100 score
- `metadata`: title, author, date, URL

### Text Processing  
**TextExtractor.extractStructuredContent()**: Returns:
- `title`: Article title
- `content`: Main article text
- `headings`: Structure outline
- `metadata`: Word count, read time, language

### API Integration
**N8NClient.summarizeArticle()**: Sends article data to n8n service
- Endpoint: `https://piccollage-ops.app.n8n.cloud/webhook/summarize`
- Timeout: 30 seconds
- Error handling with user-friendly messages
- Validation for content length and format

### UI Management
**FloatingUI.create()**: Creates and manages overlay
- CSS/HTML injection from extension resources
- Event listener setup for drag, minimize, close
- Loading states and error display

## Development Workflow

### Extension Loading
1. Content script initializes `ArticleSummarizer` class
2. Loads all required modules via dynamic script injection  
3. Detects article with confidence scoring
4. Creates floating UI if article found
5. Automatically starts summarization process

### User Interactions
- **Drag to reposition**: Click header and drag
- **Minimize**: Click minimize button (becomes floating icon)
- **Copy summary**: One-click clipboard copy with feedback
- **Chat interface**: Ask questions about article content
- **Regenerate**: Request new summary

### Error Handling
- Network timeouts with retry options
- Invalid content detection with fallbacks
- API service unavailable with graceful degradation
- User-friendly error messages throughout

## Testing

Manual testing approach:
1. Load extension in Chrome Developer Mode
2. Navigate to article-heavy sites (news, blogs, documentation)
3. Verify automatic detection and overlay appearance
4. Test summarization with various article lengths
5. Validate chat functionality with different question types
6. Check drag/drop, minimize/restore, and copy features

### Test Sites Recommended
- News sites (CNN, BBC, Reuters)
- Technical blogs (Medium, Dev.to)  
- Documentation sites
- Academic articles
- Long-form content platforms

## Configuration

### manifest.json Updates
- `web_accessible_resources` configured for modular file access
- Content scripts inject on all HTTP/HTTPS pages
- Permissions for activeTab and scripting APIs

### API Configuration
Current n8n endpoint: `https://piccollage-ops.app.n8n.cloud/webhook/summarize`
- Modify in `api/n8n-client.js` if endpoint changes
- Chat endpoint can be added as separate webhook
- Timeout and retry settings configurable

## Future Enhancements

Based on `instructions.md` specifications:
- Multiple summary lengths (quick vs detailed)
- Keyboard shortcuts for power users
- Reading progress indicators
- Article highlighting integration
- Theme customization options
- Usage statistics and analytics