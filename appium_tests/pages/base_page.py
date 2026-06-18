from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

class BasePage:
    """Base Page Object class containing common utilities and explicit waits for Appium."""
    
    def __init__(self, driver):
        self.driver = driver
        self.wait_time = 30

    def find_element(self, locator: tuple, timeout=None):
        """Wait for and find element on page, prioritizing visible ones."""
        t = timeout or self.wait_time
        try:
            return self.wait_for_visible(locator, timeout=min(t, 2))
        except Exception:
            pass
        return WebDriverWait(self.driver, t).until(
            EC.presence_of_element_located(locator)
        )

    def find_elements(self, locator: tuple, timeout=None):
        """Wait for and find multiple elements on page."""
        t = timeout or self.wait_time
        return WebDriverWait(self.driver, t).until(
            EC.presence_of_all_elements_located(locator)
        )

    def click(self, locator: tuple, timeout=None):
        """Wait for clickable and click the first visible matching element."""
        t = timeout or self.wait_time
        element = self.wait_for_visible(locator, t)
        WebDriverWait(self.driver, t).until(
            lambda d: element.is_enabled()
        )
        element.click()

    def type(self, locator: tuple, text: str, timeout=None):
        """Wait for element, clear it, and type text."""
        element = self.find_element(locator, timeout)
        element.clear()
        element.send_keys(text)

    def wait_for_visible(self, locator: tuple, timeout=None):
        """Explicitly wait for and return the first visible element matching the locator."""
        t = timeout or self.wait_time
        
        def _visible_element_located(driver):
            elements = driver.find_elements(*locator)
            for el in elements:
                try:
                    if el.is_displayed():
                        return el
                except Exception:
                    pass
            return False
            
        return WebDriverWait(self.driver, t).until(_visible_element_located)

    def wait_for_invisible(self, locator: tuple, timeout=None):
        """Explicitly wait for element to disappear."""
        t = timeout or self.wait_time
        return WebDriverWait(self.driver, t).until(
            EC.invisibility_of_element_located(locator)
        )

    def get_text(self, locator: tuple, timeout=None) -> str:
        """Fetch text from element."""
        element = self.wait_for_visible(locator, timeout)
        return element.text or element.get_attribute("text") or element.get_attribute("content-desc") or ""

    def get_page_title(self) -> str:
        """Fetch current context title."""
        try:
            return self.driver.current_activity
        except Exception:
            return "Appium Activity"
