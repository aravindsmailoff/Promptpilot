import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class DashboardPage(BasePage):
    """DashboardPage Object modeling tabs and features in PromptPilot."""

    # Tab Triggers
    HOME_TAB_BTN = (By.XPATH, "//button[contains(., 'Home') or @value='home']")
    HISTORY_TAB_BTN = (By.XPATH, "//button[contains(., 'History') or @value='history']")
    CONTEXT_TAB_BTN = (By.XPATH, "//button[contains(., 'CRM') or contains(., 'ContextPilot') or @value='context' or @data-value='context']")
    FLEET_TAB_BTN = (By.XPATH, "//button[contains(., 'Fleet') or @value='directory']")
    SETTINGS_TAB_BTN = (By.XPATH, "//button[contains(., 'Settings') or @value='settings']")

    # Home Tab (R&D Mode) Locators
    MISSION_INPUT = (By.ID, "objective-input")
    EXECUTE_MISSION_BTN = (By.ID, "execute-mission-btn")
    SYNCING_INDICATOR = (By.XPATH, "//button[contains(., 'Syncing...')]")
    AUTO_EXECUTE_BTN = (By.ID, "auto-execute-btn")
    EXECUTING_INDICATOR = (By.XPATH, "//button[contains(., 'Executing...')]")
    RESULT_PROMPT_CONTAINER = (By.XPATH, "//div[contains(@class, 'font-mono')]")

    # Fleet Tab Locators
    SUBMIT_MODEL_BTN = (By.ID, "submit-model-btn")
    MODEL_NAME_INPUT = (By.ID, "modelName")
    MODEL_URL_INPUT = (By.ID, "modelUrl")
    MODEL_DESC_INPUT = (By.ID, "description")
    CONFIRM_ENTRY_BTN = (By.ID, "confirm-model-btn")

    # Toast Locators
    TOAST_ALERT = (By.XPATH, "//ol[contains(@dir, 'ltr')]/li")

    # Co-Founder Mode Switcher Locators (in Home tab)
    RD_MODE_BTN = (By.ID, "rd-mode-btn")
    STARTUP_COFOUNDER_BTN = (By.ID, "cofounder-mode-btn")
    
    # Co-Founder Profile Locators
    STARTUP_IDEA_INPUT = (By.ID, "startup-idea")
    STARTUP_SECTOR_INPUT = (By.ID, "startup-sector")
    STARTUP_STAGE_INPUT = (By.ID, "startup-stage")
    STARTUP_ACTIVATE_BTN = (By.ID, "startup-activate-btn")

    # Navigation Actions
    def switch_to_home(self):
        self.click(self.HOME_TAB_BTN)
        
    def switch_to_history(self):
        self.click(self.HISTORY_TAB_BTN)
        
    def switch_to_context(self):
        self.click(self.CONTEXT_TAB_BTN)

    def switch_to_fleet(self):
        self.click(self.FLEET_TAB_BTN)

    def switch_to_settings(self):
        self.click(self.SETTINGS_TAB_BTN)

    # Home Tab Actions
    def execute_mission(self, parameters: str) -> str:
        """Type parameters, run mission, and return the optimized prompt result."""
        self.switch_to_rd_mode()
        self.type(self.MISSION_INPUT, parameters)
        self.click(self.EXECUTE_MISSION_BTN)
        
        # Wait until "Syncing..." finishes and result is visible
        self.wait_for_visible(self.RESULT_PROMPT_CONTAINER, timeout=20)
        return self.get_text(self.RESULT_PROMPT_CONTAINER)

    def auto_execute_mission(self) -> str:
        """Trigger Auto-Execution of the generated prompt if not already running, and wait for completion."""
        try:
            # Check if it's already executing (Executing... indicator is visible)
            self.wait_for_visible(self.EXECUTING_INDICATOR, timeout=3)
            print("[DashboardPage] Mission is already executing automatically.")
        except Exception:
            # If not executing, click the Auto-Execute button to start it
            print("[DashboardPage] Triggering Auto-Execute manually...")
            self.click(self.AUTO_EXECUTE_BTN)
            
        # Wait for execution to finish (indicator disappears or toast appears)
        self.wait_for_invisible(self.EXECUTING_INDICATOR, timeout=30)
        time.sleep(2) # Extra buffer for state updates and DB write
        return "Executed"

    def switch_to_rd_mode(self):
        """Switch Home tab to R&D Mode."""
        self.switch_to_home()
        self.click(self.RD_MODE_BTN)
        time.sleep(0.5)

    def switch_to_cofounder_mode(self):
        """Switch Home tab to Startup Co-Founder Mode."""
        self.switch_to_home()
        self.click(self.STARTUP_COFOUNDER_BTN)
        time.sleep(0.5)

    def setup_startup_profile(self, idea: str, sector: str, stage: str):
        """Fill out and activate the startup profile in Co-Founder mode."""
        self.type(self.STARTUP_IDEA_INPUT, idea)
        self.type(self.STARTUP_SECTOR_INPUT, sector)
        self.type(self.STARTUP_STAGE_INPUT, stage)
        self.click(self.STARTUP_ACTIVATE_BTN)
        time.sleep(2) # Wait for localStorage save and toast

    def select_cofounder_module(self, module_title: str):
        """Select a co-founder module card (e.g. Idea Validation)."""
        card_btn = (By.XPATH, f"//button[contains(., '{module_title}')]")
        self.click(card_btn)
        time.sleep(0.5)

    def verify_module_run_button_visible(self, module_title: str) -> bool:
        """Check if the Run button for the module is visible in the result panel."""
        run_btn = (By.XPATH, f"//button[contains(., 'Run {module_title}')]")
        try:
            el = self.wait_for_visible(run_btn, timeout=5)
            return el is not None
        except Exception:
            return False

    # History Tab Locators
    HISTORY_SEARCH_INPUT = (By.ID, "history-search-input")
    MISSION_LOG_HEADER = (By.XPATH, "//h1[contains(., 'Mission Log') or contains(., 'MISSION')]")
    SECURITY_LOCK_MSG = (By.XPATH, "//*[contains(text(), 'Security Lock')]")
    ROUTING_ONLINE_BADGE = (By.XPATH, "//*[contains(text(), 'Routing Online')]")

    # Tab triggers with data-state
    def get_tab_trigger(self, tab_value: str):
        return (By.XPATH, f"//button[@value='{tab_value}' or @data-value='{tab_value}']")

    def is_tab_active(self, tab_label: str) -> bool:
        locator = (By.XPATH, f"//button[contains(., '{tab_label}') and @data-state='active']")
        try:
            self.wait_for_visible(locator, timeout=3)
            return True
        except Exception:
            return False

    def set_viewport(self, width: int, height: int):
        self.driver.set_window_size(width, height)
        time.sleep(0.5)

    def get_element_css(self, locator: tuple, prop: str) -> str:
        el = self.find_element(locator)
        return el.value_of_css_property(prop)

    def open_fleet_submit_dialog(self):
        self.switch_to_fleet()
        self.click(self.SUBMIT_MODEL_BTN)
        time.sleep(0.5)

    def submit_fleet_without_url(self, name: str):
        """Open dialog, fill name only, attempt submit."""
        self.open_fleet_submit_dialog()
        self.type(self.MODEL_NAME_INPUT, name)
        self.click(self.CONFIRM_ENTRY_BTN)
        time.sleep(1)

    def is_fleet_dialog_open(self) -> bool:
        try:
            self.wait_for_visible(self.CONFIRM_ENTRY_BTN, timeout=2)
            return True
        except Exception:
            return False

    def search_history(self, query: str):
        self.switch_to_history()
        time.sleep(1)
        try:
            self.type(self.HISTORY_SEARCH_INPUT, query)
            time.sleep(0.5)
        except Exception:
            pass

    def load_home_page(self):
        import config
        self.navigate_to(config.BASE_URL)
        self.switch_to_home()

    # Fleet Tab Actions
    def submit_new_model(self, name: str, url: str, spec: str):
        """Submit a custom model in the Fleet directory."""
        self.switch_to_fleet()
        self.click(self.SUBMIT_MODEL_BTN)
        
        # Fill in details
        self.type(self.MODEL_NAME_INPUT, name)
        self.type(self.MODEL_URL_INPUT, url)
        self.type(self.MODEL_DESC_INPUT, spec)
        
        # Submit
        self.click(self.CONFIRM_ENTRY_BTN)
        
        # Wait until dialog is closed
        self.wait_for_invisible(self.CONFIRM_ENTRY_BTN, timeout=10)
        time.sleep(1) # Wait for animation/DB write

