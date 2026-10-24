import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/browser',
    testMatch: '**/*.spec.ts',
    reporter: 'list',
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
