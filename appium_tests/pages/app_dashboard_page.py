import time
from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class AppDashboardPage(BasePage):
    """DashboardPage Object modeling tabs and features in PromptPilot Android App."""

    # Tab Triggers
    HOME_TAB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Home') or @value='home']")
    HISTORY_TAB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'History') or @value='history']")
    CONTEXT_TAB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'CRM') or contains(@text, 'ContextPilot') or @value='context']")
    FLEET_TAB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Fleet') or @value='directory']")
    SETTINGS_TAB_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Settings') or @value='settings']")

    # Home Tab (R&D Mode) Locators
    MISSION_INPUT = (AppiumBy.XPATH, "//android.widget.EditText | //*[contains(@resource-id, 'objective-input')]")
    EXECUTE_MISSION_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Execute Mission')]")
    SYNCING_INDICATOR = (AppiumBy.XPATH, "//*[contains(@text, 'Syncing...')]")
    AUTO_EXECUTE_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Auto-Execute')]")
    EXECUTING_INDICATOR = (AppiumBy.XPATH, "//*[contains(@text, 'Executing...')]")
    RESULT_PROMPT_CONTAINER = (AppiumBy.XPATH, "//*[contains(@class, 'font-mono') or contains(@text, 'optimized')]")

    # Fleet Tab Locators
    SUBMIT_MODEL_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Submit a Model')]")
    MODEL_NAME_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@resource-id, 'modelName') or contains(@text, 'modelName')] | //android.widget.EditText[1]")
    MODEL_URL_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@resource-id, 'modelUrl') or contains(@text, 'modelUrl')] | //android.widget.EditText[2]")
    MODEL_DESC_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@resource-id, 'description') or contains(@text, 'description')] | //android.widget.EditText[3]")
    CONFIRM_ENTRY_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Confirm Entry')]")

    # Toast Locators
    TOAST_ALERT = (AppiumBy.XPATH, "//android.widget.Toast | //*[contains(@text, 'success') or contains(@text, 'Save')]")

    # Co-Founder Mode Switcher Locators (in Home tab)
    RD_MODE_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'R&D Mode')]")
    STARTUP_COFOUNDER_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Startup Co-Founder')]")
    
    # Co-Founder Profile Locators
    STARTUP_IDEA_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@resource-id, 'startup-idea')] | //android.widget.EditText[1]")
    STARTUP_SECTOR_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@hint, 'SaaS') or contains(@text, 'SaaS')] | //android.widget.EditText[2]")
    STARTUP_STAGE_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@hint, 'Seed') or contains(@text, 'Seed')] | //android.widget.EditText[3]")
    STARTUP_ACTIVATE_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Activate Co-Founder') or contains(@text, 'Update Profile')]")

    # History Tab Locators
    HISTORY_SEARCH_INPUT = (AppiumBy.XPATH, "//android.widget.EditText[contains(@hint, 'Search history')] | //android.widget.EditText")
    MISSION_LOG_HEADER = (AppiumBy.XPATH, "//*[contains(@text, 'Mission Log') or contains(@text, 'MISSION')]")
    SECURITY_LOCK_MSG = (AppiumBy.XPATH, "//*[contains(@text, 'Security Lock')]")
    ROUTING_ONLINE_BADGE = (AppiumBy.XPATH, "//*[contains(@text, 'Routing Online')]")

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
        try:
            self.wait_for_visible(self.RESULT_PROMPT_CONTAINER, timeout=20)
        except Exception:
            pass
        return self.get_text(self.RESULT_PROMPT_CONTAINER)

    def auto_execute_mission(self) -> str:
        """Trigger Auto-Execution of the generated prompt if not already running, and wait for completion."""
        try:
            # Check if it's already executing (Executing... indicator is visible)
            self.wait_for_visible(self.EXECUTING_INDICATOR, timeout=3)
            print("[AppDashboardPage] Mission is already executing automatically.")
        except Exception:
            # If not executing, click the Auto-Execute button to start it
            print("[AppDashboardPage] Triggering Auto-Execute manually...")
            self.click(self.AUTO_EXECUTE_BTN)
            
        # Wait for execution to finish
        try:
            self.wait_for_invisible(self.EXECUTING_INDICATOR, timeout=30)
        except Exception:
            pass
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
        # Find inputs and type
        inputs = self.find_elements((AppiumBy.XPATH, "//android.widget.EditText"))
        if len(inputs) >= 3:
            inputs[0].clear()
            inputs[0].send_keys(idea)
            inputs[1].clear()
            inputs[1].send_keys(sector)
            inputs[2].clear()
            inputs[2].send_keys(stage)
        else:
            try:
                self.type(self.STARTUP_IDEA_INPUT, idea)
                self.type(self.STARTUP_SECTOR_INPUT, sector)
                self.type(self.STARTUP_STAGE_INPUT, stage)
            except Exception:
                pass
        self.click(self.STARTUP_ACTIVATE_BTN)
        time.sleep(2)

    def select_cofounder_module(self, module_title: str):
        """Select a co-founder module card (e.g. Idea Validation)."""
        card_btn = (AppiumBy.XPATH, f"//*[contains(@text, '{module_title}')]")
        self.click(card_btn)
        time.sleep(0.5)

    def verify_module_run_button_visible(self, module_title: str) -> bool:
        """Check if the Run button for the module is visible in the result panel."""
        run_btn = (AppiumBy.XPATH, f"//*[contains(@text, 'Run {module_title}')]")
        try:
            el = self.wait_for_visible(run_btn, timeout=5)
            return el is not None
        except Exception:
            return False

    def is_tab_active(self, tab_label: str) -> bool:
        locator = (AppiumBy.XPATH, f"//*[contains(@text, '{tab_label}')]")
        try:
            self.wait_for_visible(locator, timeout=3)
            return True
        except Exception:
            return False

    def open_fleet_submit_dialog(self):
        self.switch_to_fleet()
        self.click(self.SUBMIT_MODEL_BTN)
        time.sleep(0.5)

    def submit_fleet_without_url(self, name: str):
        """Open dialog, fill name only, attempt submit."""
        self.open_fleet_submit_dialog()
        inputs = self.find_elements((AppiumBy.XPATH, "//android.widget.EditText"))
        if len(inputs) >= 1:
            inputs[0].clear()
            inputs[0].send_keys(name)
        else:
            try:
                self.type(self.MODEL_NAME_INPUT, name)
            except Exception:
                pass
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

    def submit_new_model(self, name: str, url: str, spec: str):
        """Submit a custom model in the Fleet directory."""
        self.switch_to_fleet()
        self.click(self.SUBMIT_MODEL_BTN)
        
        inputs = self.find_elements((AppiumBy.XPATH, "//android.widget.EditText"))
        if len(inputs) >= 3:
            inputs[0].clear()
            inputs[0].send_keys(name)
            inputs[1].clear()
            inputs[1].send_keys(url)
            inputs[2].clear()
            inputs[2].send_keys(spec)
        else:
            try:
                self.type(self.MODEL_NAME_INPUT, name)
                self.type(self.MODEL_URL_INPUT, url)
                self.type(self.MODEL_DESC_INPUT, spec)
            except Exception:
                pass
        
        self.click(self.CONFIRM_ENTRY_BTN)
        try:
            self.wait_for_invisible(self.CONFIRM_ENTRY_BTN, timeout=10)
        except Exception:
            pass
        time.sleep(1)
