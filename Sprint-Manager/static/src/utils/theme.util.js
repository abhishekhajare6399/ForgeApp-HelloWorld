import { view } from '@forge/bridge';
import { useState, useEffect } from 'react';

/** @typedef {'light' | 'dark' | 'auto'} ColorMode */

const COLOR_MODE_ATTR = 'data-color-mode';

/**
 * Reads the active Jira color mode from the document root.
 * Forge sets this after view.theme.enable() is called.
 *
 * @returns {ColorMode}
 */
export function getColorMode() {
    const mode = document.documentElement.getAttribute(COLOR_MODE_ATTR);
    if (mode === 'dark' || mode === 'auto') {
        return mode;
    }
    return 'light';
}

/**
 * Returns true when the effective theme is dark.
 * Treats "auto" as dark when the OS prefers dark (matches Jira behavior).
 *
 * @returns {boolean}
 */
export function isDarkMode() {
    const mode = getColorMode();
    if (mode === 'dark') {
        return true;
    }
    if (mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
}

/**
 * Enables Jira theme sync for Custom UI.
 * Must run before the first render so data-color-mode and design tokens are available.
 *
 * @returns {Promise<ColorMode>}
 */
export async function enableJiraTheme() {
    await view.theme.enable();
    return getColorMode();
}

/**
 * Subscribes to Jira theme changes (e.g. user switches light ↔ dark in Jira settings).
 *
 * @param {(colorMode: ColorMode) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function onColorModeChange(callback) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === COLOR_MODE_ATTR) {
                callback(getColorMode());
            }
        }
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [COLOR_MODE_ATTR],
    });

    return () => observer.disconnect();
}

/**
 * React hook — re-renders when Jira theme changes.
 *
 * @returns {{ colorMode: ColorMode, isDark: boolean }}
 */
export function useJiraTheme() {
    const [colorMode, setColorMode] = useState(getColorMode);

    useEffect(() => onColorModeChange(setColorMode), []);

    const isDark =
        colorMode === 'dark' ||
        (colorMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return { colorMode, isDark };
}
