from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

class BasePage:
    """Base Page Object class containing common utilities and explicit waits."""
    
    def __init__(self, driver):
        self.driver = driver
        self.wait_time = 30

    def navigate_to(self, url: str):
        """Navigate to a URL and bypass ngrok warning if present."""
        try:
            # Set ngrok skip browser warning header via Chrome DevTools Protocol (CDP)
            self.driver.execute_cdp_cmd('Network.enable', {})
            self.driver.execute_cdp_cmd('Network.setExtraHTTPHeaders', {
                'headers': {
                    'ngrok-skip-browser-warning': 'true'
                }
            })
        except Exception as e:
            print(f"[BasePage] Warning: Failed to set CDP headers: {e}")

        self.driver.get(url)
        try:
            import time
            # Fallback in case CDP headers failed/weren't applied
            visit_button_locator = (By.XPATH, "//button[contains(text(), 'Visit Site') or contains(., 'Visit Site') or contains(text(), 'skip') or contains(., 'skip')]")
            el = WebDriverWait(self.driver, 3).until(
                EC.element_to_be_clickable(visit_button_locator)
            )
            print("[BasePage] Detected ngrok browser warning page. Clicking 'Visit Site'...")
            el.click()
            time.sleep(2)
        except Exception:
            pass

    def find_element(self, locator: tuple, timeout=None):
        """Wait for and find element on page, prioritizing visible ones."""
        t = timeout or self.wait_time
        try:
            # Try to return the visible element first if one exists
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
        """Wait for clickable and click the first visible matching element, with JS fallback."""
        t = timeout or self.wait_time
        element = self.wait_for_visible(locator, t)
        # Ensure it is enabled
        WebDriverWait(self.driver, t).until(
            lambda d: element.is_enabled()
        )
        try:
            element.click()
        except Exception as e:
            print(f"[BasePage] Standard click on {locator} failed: {e}. Retrying via JavaScript click...")
            try:
                self.driver.execute_script("arguments[0].click();", element)
            except Exception as js_err:
                print(f"[BasePage] JavaScript click also failed: {js_err}")
                raise e

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
        return element.text

    def get_page_title(self) -> str:
        """Fetch page title."""
        return self.driver.title
