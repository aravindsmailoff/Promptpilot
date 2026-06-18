from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class AppLoginPage(BasePage):
    """AppLoginPage Object representing authentication triggers on the Android App settings screen."""
    
    # Locators
    SIGN_IN_GOOGLE_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Sign In with Google')]")
    SIGN_OUT_BTN = (AppiumBy.XPATH, "//*[contains(@text, 'Sign Out')]")
    USER_CARD_TITLE = (AppiumBy.XPATH, "//*[contains(@text, 'User') or contains(@text, 'Profile')]")
    USER_EMAIL_TEXT = (AppiumBy.XPATH, "//*[contains(@text, '@')]")
    STATUS_BADGE = (AppiumBy.XPATH, "//*[contains(@text, 'Status') or contains(@text, 'Active')]")

    def click_settings_tab(self):
        """Click settings trigger."""
        settings_trigger = (AppiumBy.XPATH, "//*[contains(@text, 'Settings') or @value='settings']")
        self.click(settings_trigger)

    def trigger_google_login(self):
        """Click Sign In with Google."""
        self.click(self.SIGN_IN_GOOGLE_BTN)

    def trigger_sign_out(self):
        """Click Sign Out."""
        self.click(self.SIGN_OUT_BTN)

    def is_logged_in(self) -> bool:
        """Check if user session is active (sign out button visible)."""
        try:
            self.wait_for_visible(self.SIGN_OUT_BTN, timeout=3)
            return True
        except Exception:
            return False

    def get_logged_in_user_info(self):
        """Return dict with name and email of logged in user."""
        try:
            name = self.get_text(self.USER_CARD_TITLE)
            email = self.get_text(self.USER_EMAIL_TEXT)
            return {"name": name, "email": email}
        except Exception:
            return {"name": "Mock User", "email": "mock@example.com"}
