#!/usr/bin/env python3
import subprocess
import time
import json
import base64
import requests
from urllib.parse import urljoin

class ChromeDevTools:
    def __init__(self, debug_port=9222):
        self.debug_port = debug_port
        self.base_url = f"http://localhost:{debug_port}"
        self.session = requests.Session()

    def get_tabs(self):
        """Get list of open tabs"""
        try:
            response = self.session.get(f"{self.base_url}/json")
            return response.json()
        except Exception as e:
            print(f"Error getting tabs: {e}")
            return []

    def take_screenshot(self, tab_url=None, quality=90):
        """Take screenshot of tab"""
        tabs = self.get_tabs()
        if not tabs:
            print("No tabs found")
            return None

        # Find tab with contractors page or use first tab
        target_tab = None
        for tab in tabs:
            if tab_url and tab_url in tab.get('url', ''):
                target_tab = tab
                break

        if not target_tab:
            target_tab = tabs[0]

        tab_id = target_tab['id']
        websocket_url = target_tab['webSocketDebuggerUrl']

        print(f"Taking screenshot of tab: {target_tab['title']}")
        print(f"URL: {target_tab['url']}")

        # Use Chrome's screenshot endpoint
        screenshot_url = f"{self.base_url}/json/{tab_id}/screenshot"
        try:
            response = self.session.get(screenshot_url)
            if response.status_code == 200:
                screenshot_data = response.json()
                if 'data' in screenshot_data:
                    # Decode base64 image data
                    image_data = base64.b64decode(screenshot_data['data'])
                    timestamp = int(time.time())
                    filename = f"contractors_screenshot_{timestamp}.png"

                    with open(filename, 'wb') as f:
                        f.write(image_data)

                    print(f"Screenshot saved as: {filename}")
                    return filename
            else:
                print(f"Failed to take screenshot: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error taking screenshot: {e}")
            return None

    def evaluate_expression(self, expression, tab_url=None):
        """Evaluate JavaScript expression in tab"""
        tabs = self.get_tabs()
        if not tabs:
            return None

        target_tab = None
        for tab in tabs:
            if tab_url and tab_url in tab.get('url', ''):
                target_tab = tab
                break

        if not target_tab:
            target_tab = tabs[0]

        tab_id = target_tab['id']

        # Use runtime evaluate endpoint
        evaluate_url = f"{self.base_url}/json/runtime/evaluate"
        params = {
            'expression': expression,
            'tabId': tab_id
        }

        try:
            response = self.session.get(evaluate_url, params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to evaluate expression: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error evaluating expression: {e}")
            return None

    def get_performance_metrics(self, tab_url=None):
        """Get performance metrics from tab"""
        tabs = self.get_tabs()
        if not tabs:
            return None

        target_tab = None
        for tab in tabs:
            if tab_url and tab_url in tab.get('url', ''):
                target_tab = tab
                break

        if not target_tab:
            target_tab = tabs[0]

      # Get performance metrics
        js_expression = """({
            timing: window.performance.timing,
            navigation: window.performance.navigation,
            memory: window.performance.memory,
            resources: window.performance.getEntriesByType('resource').length,
            domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
            loadComplete: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
            firstPaint: window.performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: window.performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
        })"""
        metrics = self.evaluate_expression(js_expression)

        return metrics

def main():
    print("Chrome DevTools Testing Script")
    print("=" * 40)

    # Wait a bit for Chrome to fully load
    time.sleep(2)

    chrome = ChromeDevTools(debug_port=9222)

    # Get available tabs
    tabs = chrome.get_tabs()
    print(f"Found {len(tabs)} tabs:")
    for i, tab in enumerate(tabs):
        print(f"  {i+1}. {tab['title']} - {tab['url']}")

    print("\n" + "=" * 40)

    # 1. Take screenshot
    print("1. Taking screenshot of contractors page...")
    screenshot_file = chrome.take_screenshot(tab_url="contractors")

    print("\n" + "=" * 40)

    # 2. Get performance metrics
    print("2. Getting performance metrics...")
    metrics = chrome.get_performance_metrics(tab_url="contractors")
    if metrics:
        print("Performance Metrics:")
        print(f"  DOM Content Loaded: {metrics.get('domContentLoaded', 0):.2f}ms")
        print(f"  Load Complete: {metrics.get('loadComplete', 0):.2f}ms")
        print(f"  First Paint: {metrics.get('firstPaint', 0):.2f}ms")
        print(f"  First Contentful Paint: {metrics.get('firstContentfulPaint', 0):.2f}ms")
        print(f"  Resources loaded: {metrics.get('resources', 0)}")

        if metrics.get('memory'):
            memory = metrics['memory']
            print(f"  Memory used: {memory.get('usedJSHeapSize', 0) / 1024 / 1024:.2f} MB")
            print(f"  Memory total: {memory.get('totalJSHeapSize', 0) / 1024 / 1024:.2f} MB")

    print("\n" + "=" * 40)

    # 3. Check for JavaScript errors
    print("3. Checking for JavaScript errors...")
    error_js = """(function() {
        const errors = [];
        const originalError = console.error;
        const originalLog = console.log;

        // Check for any error elements on the page
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
        errors.push('Error elements found: ' + errorElements.length);

        // Check if page is in error state
        if (document.title.includes('Error') || document.body.innerText.includes('DATABASE_URL is not configured')) {
            errors.push('DATABASE_URL error detected on page');
        }

        // Check if main content is loaded
        const mainContent = document.querySelector('main, .main, #main');
        const hasContent = mainContent && mainContent.innerText.length > 100;
        errors.push('Main content loaded: ' + hasContent);

        // Check for React hydration issues
        const reactRoot = document.querySelector('#__next');
        const reactLoaded = reactRoot && reactRoot.children.length > 1;
        errors.push('React app loaded: ' + reactLoaded);

        return errors;
    })()"""
    error_check = chrome.evaluate_expression(error_js)

    if error_check and 'result' in error_check:
        print("Page Health Check:")
        for result in error_check['result']:
            print(f"  {result}")

    print("\n" + "=" * 40)
    print("Testing completed!")

    if screenshot_file:
        print(f"Screenshot saved: {screenshot_file}")

if __name__ == "__main__":
    main()