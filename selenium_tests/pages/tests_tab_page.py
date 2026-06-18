import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import config


class TestsTabPage(BasePage):
    """Page Object for the in-app Tests tab."""

    TESTS_TAB_BTN = (By.XPATH, "//button[contains(., 'Tests') or @value='tests']")
    RUN_BTN = (By.XPATH, "//button[contains(., 'Run') and not(contains(., 'Re-run'))]")
    HEADLESS_TOGGLE = (By.XPATH, "//button[contains(., 'Headless') or contains(@aria-label, 'headless')]")
    FLASK_ICON_HEADER = (By.XPATH, "//*[contains(text(), 'Automation') or contains(text(), 'Test Suite')]")

    def navigate(self):
        self.navigate_to(config.BASE_URL)
        self.click(self.TESTS_TAB_BTN)
        time.sleep(1)

    def is_tests_tab_visible(self) -> bool:
        try:
            self.wait_for_visible(self.FLASK_ICON_HEADER, timeout=5)
            return True
        except Exception:
            return False

    def get_run_button_text(self) -> str:
        try:
            return self.get_text(self.RUN_BTN)
        except Exception:
            return ""
