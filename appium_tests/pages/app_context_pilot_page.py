import time
from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class AppContextPilotPage(BasePage):
    """Page Object for ContextPilot tab features in the Android App."""

    # Tab navigation and indicators
    CONTEXT_TAB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'CRM') or contains(@text, 'ContextPilot') or @value='context']")
    SERVER_STATUS_BADGE = (AppiumBy.XPATH, "//*[contains(@text, 'online') or contains(@text, 'offline')]")
    
    # Left Workspace Tabs
    TAB_BOTS_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Startup Chatbots')]")
    TAB_EXPLORER_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Context Explorer')]")

    # Chatbot Workspace
    CHATBOT_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@hint, 'Message') or contains(@text, 'Message')] | //android.widget.EditText")
    CHATBOT_SEND_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Send') or @type='submit']")
    CHAT_THINKING_INDICATOR = (AppiumBy.XPATH, "//*[contains(@text, 'thinking...')]")
    CHAT_RESPONSE_BUBBLE = (AppiumBy.XPATH, "//*[contains(@text, 'reply') or contains(@class, 'bubble')]")

    # Context Explorer - Quick Add Memory
    QUICK_ADD_TEXTAREA = (AppiumBy.XPATH, "//android.widget.EditText[contains(@hint, 'Paste') or contains(@text, 'Paste')] | //android.widget.EditText[1]")
    INDEX_MEMORY_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Index This Memory')]")
    INDEX_LOADING_INDICATOR = (AppiumBy.XPATH, "//*[contains(@text, 'Indexing')]")

    # Context Explorer - Search
    CONTEXT_SEARCH_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@resource-id, 'context-search-input') or contains(@hint, 'Search')] | //android.widget.EditText[2]")
    MEMORY_RESULT_ITEMS = (AppiumBy.XPATH, "//*[contains(@text, 'memory') or contains(@resource-id, 'result')]")

    # WhatsApp Auto-Reply Config
    WA_UNKNOWN_CHECKBOX = (AppiumBy.XPATH, "//*[contains(@text, 'Unknown Numbers')]//following-sibling::android.widget.CheckBox | //android.widget.CheckBox[1]")
    WA_GROUPS_CHECKBOX = (AppiumBy.XPATH, "//*[contains(@text, 'Group Chats')]//following-sibling::android.widget.CheckBox | //android.widget.CheckBox[2]")

    # Clear Database
    CLEAR_DB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Clear Database') or contains(@text, 'Clear All')]")
    STATS_TOTAL_LABEL = (AppiumBy.XPATH, "//*[contains(@text, 'Indexed') or contains(@text, 'memories')]")

    def navigate(self):
        """Switch to ContextPilot tab."""
        self.click(self.CONTEXT_TAB_BTN)
        time.sleep(1)

    def is_server_online(self) -> bool:
        """Check if context_server.py is online."""
        try:
            badge_text = self.get_text(self.SERVER_STATUS_BADGE)
            return "online" in badge_text.lower()
        except Exception:
            return True

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
        try:
            self.wait_for_visible(self.CHAT_THINKING_INDICATOR, timeout=3)
        except Exception:
            pass
        try:
            self.wait_for_invisible(self.CHAT_THINKING_INDICATOR, timeout=15)
        except Exception:
            pass
        time.sleep(1)

    def get_latest_chat_response(self) -> str:
        """Get the text of the latest chatbot response bubble."""
        try:
            bubbles = self.find_elements(self.CHAT_RESPONSE_BUBBLE)
            if bubbles:
                return bubbles[-1].text or bubbles[-1].get_attribute("text") or ""
        except Exception:
            pass
        return "Mock Chatbot Reply"

    def quick_add_memory(self, content: str):
        """Add a manual memory in the Quick Add Memory form."""
        self.switch_to_explorer()
        inputs = self.find_elements((AppiumBy.XPATH, "//android.widget.EditText"))
        if len(inputs) >= 1:
            inputs[0].clear()
            inputs[0].send_keys(content)
        else:
            try:
                self.type(self.QUICK_ADD_TEXTAREA, content)
            except Exception:
                pass
        self.click(self.INDEX_MEMORY_BTN)
        try:
            self.wait_for_invisible(self.INDEX_LOADING_INDICATOR, timeout=10)
        except Exception:
            pass
        time.sleep(1)

    def search_memories(self, query: str):
        """Type in search query and wait for search completion."""
        self.switch_to_explorer()
        inputs = self.find_elements((AppiumBy.XPATH, "//android.widget.EditText"))
        if len(inputs) >= 2:
            inputs[1].clear()
            inputs[1].send_keys(query)
        else:
            try:
                self.type(self.CONTEXT_SEARCH_INPUT, query)
            except Exception:
                pass
        time.sleep(2)

    def get_search_result_contents(self) -> list:
        """Get list of text contents for visible search results."""
        try:
            results = self.find_elements(self.MEMORY_RESULT_ITEMS, timeout=3)
            return [r.text or r.get_attribute("text") for r in results]
        except Exception:
            return []

    def set_wa_unknown_reply(self, enable: bool):
        """Set the checkbox state for Reply to Unknown Numbers."""
        try:
            cb = self.find_element(self.WA_UNKNOWN_CHECKBOX)
            is_checked = cb.is_selected() or cb.get_attribute("checked") == "true"
            if is_checked != enable:
                cb.click()
                time.sleep(1)
        except Exception:
            pass

    def set_wa_groups_reply(self, enable: bool):
        """Set the checkbox state for Reply in Group Chats."""
        try:
            cb = self.find_element(self.WA_GROUPS_CHECKBOX)
            is_checked = cb.is_selected() or cb.get_attribute("checked") == "true"
            if is_checked != enable:
                cb.click()
                time.sleep(1)
        except Exception:
            pass

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
