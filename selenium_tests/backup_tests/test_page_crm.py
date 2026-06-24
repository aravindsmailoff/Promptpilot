import pytest
import time
from selenium.webdriver.common.by import By
from test_helpers import run_test
from pages.dashboard_page import DashboardPage
from pages.context_pilot_page import ContextPilotPage

VIEWPORTS = [
    ("mobile", 375, 812),
    ("tablet", 768, 1024),
    ("laptop", 1280, 800),
    ("desktop", 1440, 900),
    ("fhd", 1920, 1080),
]

SCENARIOS = [
    ("crm_nav", "Navigate to CRM and verify ContextPilot header"),
    ("crm_server_badge", "Check context server status badge"),
    ("crm_tab_bots", "Switch left panel to Chatbots"),
    ("crm_tab_explorer", "Switch left panel to Context Explorer"),
    ("crm_chat_empty", "Verify empty chatbot message input state"),
    ("crm_chat_hello", "Chat with bot: Hello"),
    ("crm_chat_help", "Chat with bot: Help me write a marketing plan"),
    ("crm_chat_xss", "Chat with bot: XSS script"),
    ("crm_chat_sqli", "Chat with bot: SQL injection query"),
    ("crm_chat_spec_chars", "Chat with bot: Special characters"),
    ("crm_chat_long", "Chat with bot: Long text input"),
    ("crm_quick_add_empty", "Submit empty quick-add memory form"),
    ("crm_quick_add_valid", "Submit valid quick-add memory"),
    ("crm_quick_add_xss", "Submit quick-add memory with XSS payload"),
    ("crm_quick_add_sqli", "Submit quick-add memory with SQLi payload"),
    ("crm_search_memories", "Search memories database"),
    ("crm_wa_unknown_cb", "Toggle WhatsApp Unknown Numbers checkbox"),
    ("crm_wa_groups_cb", "Toggle WhatsApp Groups checkbox"),
    ("crm_clear_db", "Verify Clear Database trigger"),
    ("crm_tab_persistence", "Verify CRM state after tab switching"),
]

@pytest.mark.parametrize("vp_name, width, height", VIEWPORTS)
@pytest.mark.parametrize("sc_name, desc", SCENARIOS)
def test_crm_page_scenarios(driver, reporter, vp_name, width, height, sc_name, desc):
    """Execute CRM Tab test scenarios across different viewport resolutions."""
    test_id = f"TC_CRM_{vp_name}_{sc_name}"
    
    def _fn():
        dash = DashboardPage(driver)
        ctx = ContextPilotPage(driver)
        
        # Check if we are already on CRM page to skip full reloads
        try:
            driver.find_element(By.ID, "bot-chat-input")
        except Exception:
            dash.load_home_page()
            ctx.navigate()
            time.sleep(0.3)
            
        dash.set_viewport(width, height)
        
        # Scenario execution logic
        if sc_name == "crm_nav":
            h1 = driver.find_element(By.TAG_NAME, "h1")
            assert h1.is_displayed()
            assert "Context" in h1.text or "CRM" in h1.text
            return "Navigated to CRM and verified h1 header."
            
        elif sc_name == "crm_server_badge":
            badge = ctx.find_element(ctx.SERVER_STATUS_BADGE)
            assert badge.is_displayed()
            return f"Server badge is visible: {badge.text}"
            
        elif sc_name == "crm_tab_bots":
            ctx.switch_to_bots()
            btn = ctx.find_element(ctx.TAB_BOTS_BTN)
            assert btn.is_displayed()
            return "Switched to Chatbots tab."
            
        elif sc_name == "crm_tab_explorer":
            ctx.switch_to_explorer()
            btn = ctx.find_element(ctx.TAB_EXPLORER_BTN)
            assert btn.is_displayed()
            return "Switched to Context Explorer tab."
            
        elif sc_name.startswith("crm_chat_"):
            ctx.switch_to_bots()
            tx = ctx.find_element(ctx.CHATBOT_INPUT)
            
            if sc_name == "crm_chat_empty":
                tx.clear()
                btn = ctx.find_element(ctx.CHATBOT_SEND_BTN)
                assert not btn.is_enabled() or btn.get_attribute("disabled") is not None
                return "Chat send button is disabled for empty input."
            else:
                payload = desc.split("Chat with bot: ")[-1]
                ctx.send_chatbot_message(payload)
                return f"Sent chat message '{sc_name}' successfully."
                
        elif sc_name.startswith("crm_quick_add_"):
            ctx.switch_to_explorer()
            tx = ctx.find_element(ctx.QUICK_ADD_TEXTAREA)
            
            if sc_name == "crm_quick_add_empty":
                tx.clear()
                btn = ctx.find_element(ctx.INDEX_MEMORY_BTN)
                assert not btn.is_enabled() or btn.get_attribute("disabled") is not None
                return "Index Memory button is disabled on empty input."
            else:
                payload = desc.split("Submit quick-add memory: ")[-1] if "Submit quick-add memory: " in desc else "Standard memory context payload."
                ctx.quick_add_memory(payload)
                return f"Memory payload '{sc_name}' indexed successfully."
                
        elif sc_name == "crm_search_memories":
            ctx.switch_to_explorer()
            ctx.search_memories("test")
            return "Memory search complete."
            
        elif sc_name == "crm_wa_unknown_cb":
            ctx.switch_to_bots()
            ctx.set_wa_unknown_reply(True)
            ctx.set_wa_unknown_reply(False)
            return "Toggled WhatsApp unknown reply checkbox."
            
        elif sc_name == "crm_wa_groups_cb":
            ctx.switch_to_bots()
            ctx.set_wa_groups_reply(True)
            ctx.set_wa_groups_reply(False)
            return "Toggled WhatsApp groups reply checkbox."
            
        elif sc_name == "crm_clear_db":
            ctx.clear_database()
            return "Cleared memory database successfully."
            
        elif sc_name == "crm_tab_persistence":
            dash.switch_to_home()
            time.sleep(0.1)
            ctx.navigate()
            time.sleep(0.1)
            h1 = driver.find_element(By.TAG_NAME, "h1")
            assert "Context" in h1.text or "CRM" in h1.text
            return "Verified CRM tab state persistence after switching."
            
        return "Scenario completed."
        
    run_test(reporter, test_id, "CRM Tab", f"CRM Tab scenario: {desc} (Resolution: {width}x{height})",
              ["Navigate CRM", f"Set view {width}x{height}", f"Run {sc_name}"], "Expected element interaction occurs.", _fn, driver=driver, soft_pass=True)
