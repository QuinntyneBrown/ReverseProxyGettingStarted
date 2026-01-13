# Design Mockups

This folder contains HTML mockups of the telemetry dashboard design.

## Files

- `dashboard-mockup.html` - Main dashboard layout with table and charts
- `gridstack-mockup.html` - Interactive GridStack layout demonstration

## Generating PNG Screenshots

To generate PNG screenshots from the HTML mockups, you can use one of these methods:

### Using Playwright (Recommended)

```bash
cd ../src/ReverseProxy.Workspace
npx playwright screenshot designs/dashboard-mockup.html designs/dashboard-mockup.png --full-page
npx playwright screenshot designs/gridstack-mockup.html designs/gridstack-mockup.png --full-page
```

### Using Chrome DevTools

1. Open the HTML file in Chrome
2. Press F12 to open DevTools
3. Press Ctrl+Shift+P and type "screenshot"
4. Select "Capture full size screenshot"

### Using Puppeteer

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('file:///path/to/dashboard-mockup.html');
  await page.screenshot({ path: 'dashboard-mockup.png', fullPage: true });

  await page.goto('file:///path/to/gridstack-mockup.html');
  await page.screenshot({ path: 'gridstack-mockup.png', fullPage: true });

  await browser.close();
})();
```

## Mockup Features

### Dashboard Mockup
- Dark theme with Material Design colors
- Responsive 3-column grid layout
- Telemetry data table with filtering
- Multiple chart widgets

### GridStack Mockup
- Interactive 10x30 grid
- Resizable widgets (drag corners)
- Moveable widgets (drag headers)
- Various widget sizes demonstrated
