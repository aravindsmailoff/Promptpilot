from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import config

class LoginPage(BasePage):
    """LoginPage Object representing authentication triggers on the app."""
    
    # Locators
    SIGN_IN_GOOGLE_BTN = (By.XPATH, "//button[contains(., 'Sign In with Google')]")
    SIGN_OUT_BTN = (By.XPATH, "//button[contains(., 'Sign Out')]")
    USER_CARD_TITLE = (By.XPATH, "//h3[contains(@class, 'text-2xl') and contains(@class, 'font-black')]")
    USER_EMAIL_TEXT = (By.XPATH, "//p[contains(@class, 'text-xs') and contains(@class, 'text-muted-foreground') and contains(text(), '@')]")
    STATUS_BADGE = (By.XPATH, "//span[contains(@class, 'Badge')]")

    def load(self):
        """Navigate to Settings page where login controls reside."""
        self.navigate_to(f"{config.BASE_URL}")
        # Need to switch to Settings tab to interact with Login
        self.click_settings_tab()

    def click_settings_tab(self):
        """Click settings trigger in header or footer."""
        # Radical UI tab trigger
        settings_trigger = (By.XPATH, "//button[contains(., 'Settings') or @value='settings']")
        self.click(settings_trigger)

    def trigger_google_login(self):
        """Click Sign In with Google."""
        self.click(self.SIGN_IN_GOOGLE_BTN)

    def trigger_sign_out(self):
        """Click Sign Out."""
        self.click(self.SIGN_OUT_BTN)

    def is_logged_in(self) -> bool:
        """Check if user session is active (avatar and sign out button visible)."""
        try:
            self.wait_for_visible(self.SIGN_OUT_BTN, timeout=3)
            return True
        except Exception:
            return False

    def get_logged_in_user_info(self):
        """Return dict with name and email of logged in user."""
        name = self.get_text(self.USER_CARD_TITLE)
        email = self.get_text(self.USER_EMAIL_TEXT)
        return {"name": name, "email": email}
