import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class ContextPilotPage(BasePage):
    """Page Object for ContextPilot tab features."""

    # Tab navigation and indicators
    CONTEXT_TAB_BTN = (By.XPATH, "//button[contains(., 'CRM') or contains(., 'ContextPilot') or @value='context' or @data-value='context']")
    SERVER_STATUS_BADGE = (By.XPATH, "//*[contains(text(), 'context_server.py online') or contains(text(), 'context_server.py offline')]")
    
    # Left Workspace Tabs
    TAB_BOTS_BTN = (By.XPATH, "//button[contains(., 'Startup Chatbots')]")
    TAB_EXPLORER_BTN = (By.XPATH, "//button[contains(., 'Context Explorer')]")

    # Chatbot Workspace
    CHATBOT_INPUT = (By.XPATH, "//input[contains(@placeholder, 'Message ')]")
    CHATBOT_SEND_BTN = (By.XPATH, "//form[contains(@class, 'flex')]//button[@type='submit']")
    CHAT_THINKING_INDICATOR = (By.XPATH, "//*[contains(text(), 'thinking...')]")
    CHAT_RESPONSE_BUBBLE = (By.XPATH, "//div[contains(@class, 'bg-white/5') and contains(@class, 'text-slate-200')]")

    # Context Explorer - Quick Add Memory
    PASTE_APP_SELECT = (By.XPATH, "//button[contains(., 'Manual note') or contains(., 'Select type')]")
    QUICK_ADD_TEXTAREA = (By.XPATH, "//textarea[contains(@placeholder, 'Paste any text here to index it')]")
    INDEX_MEMORY_BTN = (By.XPATH, "//button[contains(., 'Index This Memory')]")
    INDEX_LOADING_INDICATOR = (By.XPATH, "//*[contains(text(), 'Indexing')]")

    # Context Explorer - Search
    CONTEXT_SEARCH_INPUT = (By.ID, "context-search-input")
    SEARCH_TIME_LABEL = (By.XPATH, "//*[contains(text(), 'ms')]")
    MEMORY_RESULT_ITEMS = (By.XPATH, "//div[contains(@class, 'group relative bg-white/5')]")

    # WhatsApp Auto-Reply Config
    WA_UNKNOWN_CHECKBOX = (By.XPATH, "//div[contains(., 'Reply to Unknown Numbers')]/..//input[@type='checkbox']")
    WA_GROUPS_CHECKBOX = (By.XPATH, "//div[contains(., 'Reply in Group Chats')]/..//input[@type='checkbox']")

    def navigate(self):
        """Switch to ContextPilot tab."""
        self.click(self.CONTEXT_TAB_BTN)
        time.sleep(1)

    def is_server_online(self) -> bool:
        """Check if context_server.py is online."""
        try:
            badge_text = self.get_text(self.SERVER_STATUS_BADGE, timeout=3)
            return "online" in badge_text.lower()
        except Exception:
            return False

    def switch_to_bots(self):
        """Switch left pane to Startup Chatbots tab."""
        self.click(self.TAB_BOTS_BTN)
        time.sleep(0.5)

    def switch_to_explorer(self):
        """Switch left pane to Context Explorer tab."""
        self.click(self.TAB_EXPLORER_BTN)
        time.sleep(0.5)

    def send_chatbot_message(self, message: str):
        """Send a message to the active chatbot and wait for response."""
        self.type(self.CHATBOT_INPUT, message)
        self.click(self.CHATBOT_SEND_BTN)
        
        # Wait for thinking indicator to appear and then disappear (or just wait for message to complete)
        try:
            self.wait_for_visible(self.CHAT_THINKING_INDICATOR, timeout=3)
        except Exception:
            pass # might have responded very fast
            
        self.wait_for_invisible(self.CHAT_THINKING_INDICATOR, timeout=30)
        time.sleep(1)

    def get_latest_chat_response(self) -> str:
        """Get the text of the latest chatbot response bubble."""
        bubbles = self.find_elements(self.CHAT_RESPONSE_BUBBLE)
        if bubbles:
            return bubbles[-1].text
        return ""

    def quick_add_memory(self, content: str):
        """Add a manual memory in the Quick Add Memory form."""
        self.switch_to_explorer()
        self.type(self.QUICK_ADD_TEXTAREA, content)
        self.click(self.INDEX_MEMORY_BTN)
        
        # Wait for indexing to complete
        try:
            self.wait_for_visible(self.INDEX_LOADING_INDICATOR, timeout=2)
        except Exception:
            pass
            
        self.wait_for_invisible(self.INDEX_LOADING_INDICATOR, timeout=15)
        time.sleep(1)

    def search_memories(self, query: str):
        """Type in search query and wait for search completion."""
        self.switch_to_explorer()
        self.type(self.CONTEXT_SEARCH_INPUT, query)
        # Give 350ms debounce + execution time to settle
        time.sleep(2)

    def get_search_result_contents(self) -> list:
        """Get list of text contents for visible search results."""
        try:
            results = self.find_elements(self.MEMORY_RESULT_ITEMS, timeout=3)
            return [r.text for r in results]
        except Exception:
            return []

    def set_wa_unknown_reply(self, enable: bool):
        """Set the checkbox state for Reply to Unknown Numbers."""
        cb = self.find_element(self.WA_UNKNOWN_CHECKBOX)
        is_checked = cb.is_selected()
        if is_checked != enable:
            self.click(self.WA_UNKNOWN_CHECKBOX)
            time.sleep(1)

    def set_wa_groups_reply(self, enable: bool):
        """Set the checkbox state for Reply in Group Chats."""
        cb = self.find_element(self.WA_GROUPS_CHECKBOX)
        is_checked = cb.is_selected()
        if is_checked != enable:
            self.click(self.WA_GROUPS_CHECKBOX)
            time.sleep(1)

    CLEAR_DB_BTN = (By.XPATH, "//button[contains(., 'Clear Database') or contains(., 'Clear All')]")
    STATS_TOTAL_LABEL = (By.XPATH, "//*[contains(text(), 'Indexed') or contains(text(), 'memories')]")
    IMPORT_DROPZONE = (By.XPATH, "//*[contains(@class, 'border-dashed') or contains(text(), 'Drop') or contains(text(), 'drag')]")

    def get_server_badge_text(self) -> str:
        try:
            return self.get_text(self.SERVER_STATUS_BADGE)
        except Exception:
            return ""

    def is_badge_online(self) -> bool:
        return "online" in self.get_server_badge_text().lower()

    def clear_database(self):
        self.switch_to_explorer()
        try:
            self.click(self.CLEAR_DB_BTN)
            time.sleep(2)
        except Exception:
            pass

    def get_stats_text(self) -> str:
        try:
            return self.get_text(self.STATS_TOTAL_LABEL)
        except Exception:
            return ""
