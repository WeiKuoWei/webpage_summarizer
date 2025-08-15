# Chrome Extension Development Requirements Report
## Article Summarizer with AI Chat Interface

---

## **Project Overview**

We are building a Chrome browser extension that automatically appears when someone visits a webpage containing an article (like news sites, blogs, or research papers). The extension will:

1. **Automatically summarize the article** using artificial intelligence
2. **Display the summary in a floating window** on top of the webpage
3. **Allow users to chat with an AI** about the article content
4. **Provide copy and sharing features** for easy use

Think of it like having a smart reading assistant that pops up whenever you're reading something online, gives you the key points, and can answer questions about what you're reading.

---

## **Core Requirements**

### **Requirement 1: Automatic Article Detection**
**What it does:** The extension must automatically detect when a webpage contains an article worth summarizing.

**How it works:** The extension scans the webpage looking for signs that indicate article content, such as:
- HTML elements commonly used for articles (like `<article>` tags)
- Multiple paragraphs of text in a row
- Common article layouts (title, author, content sections)
- Minimum word count (articles should have at least 300-500 words)

**User experience:** Users don't need to do anything - the extension just "knows" when they're reading an article.

### **Requirement 2: Floating Overlay Interface**
**What it does:** Instead of requiring users to click an extension icon, a floating window appears directly on the webpage.

**How it works:** The extension creates a small, moveable window that sits on top of the webpage content. This window:
- Appears automatically when an article is detected
- Can be dragged around the screen by the user
- Can be minimized to a small icon when not needed
- Can be expanded back to full size when clicked
- Stays in position while the user scrolls through the article

**User experience:** Like having a sticky note that follows you around the webpage, but much smarter.

### **Requirement 3: AI-Powered Article Summary**
**What it does:** The extension sends the article text to an AI service and receives a concise summary.

**How it works:** 
- The extension extracts all the text from the article
- Sends this text to our AI service (hosted on n8n platform)
- The AI reads the article and creates 3-4 bullet points highlighting the main ideas
- The summary is formatted using Markdown (a simple text formatting system)
- The summary appears in the floating window

**User experience:** Within 5-10 seconds of visiting an article, users see the key points without having to read the entire piece.

### **Requirement 4: Copy Summary Feature**
**What it does:** Users can copy the AI-generated summary to their clipboard with one click.

**How it works:**
- A "Copy Summary" button appears next to the summary
- When clicked, the entire summary text is copied to the user's clipboard
- A brief confirmation message shows that copying was successful
- Users can then paste the summary anywhere (emails, notes, documents)

**User experience:** Easy sharing and saving of article summaries for later reference.

### **Requirement 5: AI Chat Interface**
**What it does:** Below the summary, users can type questions about the article and get AI-powered answers.

**How it works:**
- A chat interface appears below the summary with a text input box
- Users type questions like "What was the main conclusion?" or "Can you explain this in simpler terms?"
- The AI has access to the original article content as context
- The AI responds with relevant answers based on the article content
- The conversation history is preserved during the session

**User experience:** Like having a knowledgeable friend who has read the article and can answer questions about it.

---

## **Enhanced Features**

### **Feature 1: Markdown Rendering**
**Purpose:** Make summaries look professional and easy to read
**Implementation:** Convert plain text summaries into properly formatted text with bullet points, bold text, and other formatting

### **Feature 2: Draggable Positioning**
**Purpose:** Let users move the floating window to their preferred location
**Implementation:** Users can click and drag the window title bar to reposition it anywhere on screen

### **Feature 3: Minimize/Expand Functionality**
**Purpose:** Allow users to hide the interface when not needed but keep it easily accessible
**Implementation:** A minimize button (-) shrinks the window to a small icon; clicking the icon restores full size

### **Feature 4: Smooth Animations**
**Purpose:** Make the interface feel polished and professional
**Implementation:** Gentle fade-in effects when the window appears, smooth transitions when minimizing/expanding

### **Feature 5: Keyboard Shortcuts**
**Purpose:** Power users can control the extension without using the mouse
**Implementation:** 
- ESC key closes the floating window
- Ctrl+S triggers summarization
- Other shortcuts for common actions

### **Feature 6: Reading Progress Indicator**
**Purpose:** Show users how much of the article they've read
**Implementation:** A progress bar that fills up as users scroll through the article

### **Feature 7: Multiple Summary Lengths**
**Purpose:** Let users choose between quick overview or detailed summary
**Implementation:** Buttons for "Quick Summary" (2-3 points) and "Detailed Summary" (5-6 points)

### **Feature 8: Highlight Key Sentences**
**Purpose:** Mark the most important sentences directly in the original article
**Implementation:** The AI identifies key sentences and highlights them with colored backgrounds in the article text

### **Feature 9: Share Functionality**
**Purpose:** Easy sharing of summaries and chat conversations
**Implementation:** Export options for email, social media, or saving to files

### **Feature 10: Theme Toggle**
**Purpose:** Comfortable reading in different lighting conditions
**Implementation:** Switch between light mode (white background) and dark mode (dark background)

### **Feature 11: Error Handling and Retry**
**Purpose:** Graceful handling when things go wrong
**Implementation:** Clear error messages and one-click retry buttons when AI services are unavailable

### **Feature 12: Loading States**
**Purpose:** Show users that something is happening during processing
**Implementation:** Animated loading indicators during summarization and chat responses

---

## **File Structure and Implementation Details**

### **Root Directory Files**

#### **manifest.json**
**Purpose:** This is like the "birth certificate" of the Chrome extension
**What it contains:**
- Extension name, version, and description
- List of permissions the extension needs (like accessing webpage content)
- Instructions for Chrome on how to load the extension
- Security settings and content script configurations

#### **Directory: content/**
This folder contains files that run directly on webpages and detect articles.

#### **content.js**
**Purpose:** The main coordinator that starts everything
**What it does:**
- Runs automatically when any webpage loads
- Checks if the page contains an article
- If an article is found, starts the summarization process
- Manages communication between different parts of the extension
**Technical implementation:**
- Imports and coordinates other content scripts
- Sets up event listeners for webpage changes
- Handles initial article detection workflow

#### **article-detector.js**
**Purpose:** Smart detection of whether a webpage contains an article worth summarizing
**What it does:**
- Scans the webpage's HTML structure looking for article indicators
- Counts words and paragraphs to determine if there's enough content
- Assigns a confidence score (0-100%) that the page contains an article
- Filters out pages like shopping sites, search results, or navigation pages
**Technical implementation:**
- Searches for HTML elements like `<article>`, `<main>`, `.post-content`
- Analyzes text patterns (paragraph length, sentence structure)
- Checks for common article metadata (author, publish date, title structure)
- Returns boolean result: "is this an article?" plus confidence score

#### **text-extractor.js**
**Purpose:** Intelligently extracts the main article text from webpage clutter
**What it does:**
- Separates article content from navigation menus, advertisements, comments, and sidebars
- Cleans up the text by removing extra spaces, formatting, and HTML code
- Preserves paragraph structure for better AI processing
- Handles different website layouts and content management systems
**Technical implementation:**
- Uses multiple extraction strategies (CSS selectors, content analysis)
- Removes boilerplate text (headers, footers, navigation)
- Handles special cases like multi-page articles or embedded media
- Returns clean, readable text ready for AI processing

#### **floating-ui.js**
**Purpose:** Creates and manages the floating window that appears on webpages
**What it does:**
- Creates the floating window DOM structure
- Handles window positioning, dragging, and resizing
- Manages window state (minimized, expanded, closed)
- Ensures the window doesn't interfere with webpage functionality
**Technical implementation:**
- Creates HTML elements and injects them into the webpage
- Implements drag-and-drop functionality for repositioning
- Handles z-index management (keeping window on top)
- Stores user's preferred position for future visits
- Manages window lifecycle (creation, updates, destruction)

### **Directory: ui/**
This folder contains all the user interface components and styling.

#### **overlay.html**
**Purpose:** The HTML template that defines the structure of the floating window
**What it contains:**
- Header section with title and control buttons (minimize, close)
- Summary display area with formatting
- Copy button for summary
- Chat interface with message history and input field
- Loading indicators and error message areas
**Structure:**
```
Header Bar (title, minimize, close buttons)
├── Summary Section
│   ├── Loading indicator
│   ├── Summary text area
│   └── Copy button
├── Chat Section
│   ├── Message history
│   ├── Input field
│   └── Send button
└── Footer (status messages, settings)
```

#### **overlay.css**
**Purpose:** All the visual styling that makes the interface look professional
**What it defines:**
- Colors, fonts, and spacing for all interface elements
- Responsive design that works on different screen sizes
- Hover effects and visual feedback for buttons
- Dark and light theme color schemes
- Animation keyframes for smooth transitions
**Key styling areas:**
- Window appearance (borders, shadows, rounded corners)
- Typography (font sizes, line spacing, hierarchy)
- Button styles (colors, hover effects, disabled states)
- Chat bubble styling (user vs AI message appearance)
- Loading animations and progress indicators

#### **overlay.js**
**Purpose:** Handles all user interactions within the floating window
**What it manages:**
- Button click events (copy, minimize, close, send message)
- Window dragging and positioning
- State management (minimized/expanded, theme selection)
- Communication with background services
**Key functions:**
- Initialize window with proper positioning
- Handle drag-to-move functionality
- Manage minimize/expand animations
- Process user clicks and keyboard input
- Update window content based on user actions

#### **summary-renderer.js**
**Purpose:** Converts AI-generated text into properly formatted, readable summaries
**What it does:**
- Takes raw text from the AI service
- Converts Markdown formatting into HTML for display
- Implements the copy-to-clipboard functionality
- Handles different summary formats (bullet points, numbered lists, paragraphs)
**Technical implementation:**
- Markdown parsing (converts *bold* to **bold**, etc.)
- HTML sanitization for security
- Clipboard API integration for copying
- Success/failure feedback for copy operations

#### **chat-interface.js**
**Purpose:** Manages the conversation between user and AI about the article
**What it handles:**
- Displaying chat messages in conversation format
- Managing message history and scrolling
- Sending user questions to the AI service
- Formatting and displaying AI responses
**Key features:**
- Message bubble styling (user messages on right, AI on left)
- Auto-scroll to latest message
- Typing indicators when AI is responding
- Message timestamps and status indicators
- Input validation and error handling

#### **animations.js**
**Purpose:** Creates smooth, professional animations throughout the interface
**What it provides:**
- Fade-in effect when floating window first appears
- Smooth expand/collapse animations for minimize feature
- Loading spinners and progress indicators
- Hover effects and button feedback
- Transition animations between different states
**Technical implementation:**
- CSS animation management through JavaScript
- Performance-optimized animations (using transforms, not layout changes)
- Animation timing and easing functions
- Fallback handling for low-performance devices

### **Directory: api/**
This folder handles all communication with external AI services.

#### **n8n-client.js**
**Purpose:** Manages all communication with the n8n workflow (our AI backend)
**What it does:**
- Sends article text to n8n for summarization
- Sends chat messages with article context to n8n
- Handles API responses and error conditions
- Manages request timeouts and retry logic
**Key functions:**
- `summarizeArticle(text)` - requests article summary
- `sendChatMessage(message, context)` - sends chat question with article context
- `handleAPIErrors(error)` - processes and displays error messages
- Automatic retry logic for failed requests

#### **api-config.js**
**Purpose:** Central configuration for all API endpoints and settings
**What it contains:**
- n8n webhook URLs for different functions
- Request timeout settings
- Error message templates
- API key management (if needed for future features)
**Configuration items:**
- Summarization endpoint URL
- Chat endpoint URL
- Request timeout values (30 seconds for summaries, 15 seconds for chat)
- Maximum text length limits
- Rate limiting settings

### **Directory: utils/**
This folder contains helper functions used throughout the extension.

#### **dom-utils.js**
**Purpose:** Common functions for manipulating webpage elements
**What it provides:**
- Safe element creation and insertion
- CSS class management
- Event listener helpers
- Cross-browser compatibility functions
**Key functions:**
- `createElement(type, classes, content)` - safely create HTML elements
- `findElement(selector)` - robust element finding with fallbacks
- `addEventListeners(element, events)` - multiple event binding
- `removeElement(element)` - safe element removal

#### **storage.js**
**Purpose:** Manages saving and loading user preferences and settings
**What it handles:**
- Window position preferences
- Theme selection (dark/light mode)
- Summary length preferences
- Chat history (temporary storage)
**Key functions:**
- `saveWindowPosition(x, y)` - remember where user positioned window
- `loadUserPreferences()` - restore saved settings
- `clearSessionData()` - cleanup when closing
- Chrome extension storage API integration

#### **keyboard-shortcuts.js**
**Purpose:** Implements keyboard shortcuts for power users
**What it manages:**
- ESC key to close floating window
- Ctrl+S to trigger summarization
- Enter key to send chat messages
- Tab navigation within the interface
**Technical implementation:**
- Global keyboard event listeners
- Shortcut conflict prevention
- Context-aware shortcut activation (only when extension is visible)
- Accessibility compliance for keyboard navigation

### **Directory: assets/**
This folder contains images, icons, and other static resources.

#### **icons/ subdirectory**
**Purpose:** Contains extension icons for different contexts
**Files needed:**
- `icon16.png` - Small icon for extension menu (16x16 pixels)
- `icon48.png` - Medium icon for extension management page (48x48 pixels)
- `icon128.png` - Large icon for Chrome Web Store and settings (128x128 pixels)
**Design requirements:**
- Simple, recognizable design
- Clear visibility at small sizes
- Consistent with extension purpose (perhaps a document with AI symbol)

#### **fonts/ subdirectory**
**Purpose:** Custom fonts for professional appearance (if needed)
**Potential contents:**
- Custom web fonts for better typography
- Icon fonts for UI symbols
- Fallback font specifications

### **Directory: popup/**
This folder maintains the original popup interface as a backup option.

#### **popup.html & popup.js**
**Purpose:** Fallback interface accessible through extension icon
**What it provides:**
- Manual summarization option if auto-detection fails
- Settings and preferences interface
- Troubleshooting and help information
- Alternative access method for users who prefer clicking extension icon

---

## **User Experience Flow**

### **Typical Usage Scenario:**

1. **User visits news website** (e.g., CNN, BBC, Medium article)

2. **Article detection** (article-detector.js)
   - Extension scans page in background
   - Determines page contains article content
   - Confidence score: 85% (high confidence)

3. **Text extraction** (text-extractor.js)
   - Extracts main article text
   - Removes navigation, ads, comments
   - Identifies 847 words of clean article content

4. **Floating UI creation** (floating-ui.js)
   - Small window fades in at top-right corner
   - Shows "Analyzing article..." with loading animation

5. **AI summarization** (n8n-client.js + API)
   - Sends article text to AI service
   - Receives 4-bullet point summary within 5 seconds
   - Summary appears with copy button

6. **User interaction**
   - User reads summary
   - Clicks copy button to save summary
   - Types question: "What are the implications of this research?"
   - AI responds with contextual answer based on article

7. **Cleanup**
   - User minimizes window to continue reading
   - Window stays accessible as small icon
   - When user leaves page, extension cleans up and resets

### **Error Handling Scenarios:**

1. **No article detected:** Extension remains inactive, no floating window appears
2. **AI service unavailable:** Error message with retry button
3. **Network timeout:** Graceful error message with manual retry option
4. **Webpage blocks extension:** Fallback to popup interface

---

## **Technical Architecture Summary**

The extension follows a modular architecture where each file has a specific responsibility:

- **Content scripts** run on webpages and detect articles
- **UI components** handle user interaction and display
- **API clients** manage communication with AI services
- **Utilities** provide common functionality across components
- **Assets** contain static resources for appearance

This structure allows for:
- **Easy maintenance:** Each feature is in its own file
- **Scalability:** New features can be added without affecting existing code
- **Testing:** Individual components can be tested separately
- **Performance:** Only necessary code runs for each function

The extension prioritizes user experience with automatic detection, professional appearance, and responsive performance while maintaining security and privacy standards required for Chrome extensions.