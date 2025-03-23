/**
 * Checks the presence and uniqueness of the <h1> tag.
 */
export function checkH1(enableCheckH1?: boolean): void {
    if (!enableCheckH1) return;

    const h1Elements = document.querySelectorAll('h1');
    let issues = 0;

    if (h1Elements.length > 1) {
        console.error(`❌ Multiple <h1> elements found (${h1Elements.length}). There should only be one.`);
        issues++;
    } else if (h1Elements.length === 0) {
        console.error(`❌ No <h1> element found.`);
        issues++;
    }

    // Visual aid: Outline all H1s
    h1Elements.forEach(h1 => {
        const el = h1 as HTMLElement;

        el.title = '❌ Review this H1: should be unique and descriptive.';
    });

    if (issues === 0) {
        console.log('✅ <h1> element structure is correct.');
    } else {
        console.warn(`⚠️ Found ${issues} issue(s) with <h1> tags.`);
    }
}

/**
 * Checks if the first <h1> element is visible in the viewport.
 */
export function checkH1Visible(enableCheckH1Visible: boolean): boolean {
    if (!enableCheckH1Visible) return false;

    const h1Tag: HTMLHeadingElement | null = document.querySelector('h1');

    if (!h1Tag) {
        console.error('❌ No <h1> tag found to check visibility.');
        return false;
    }

    const style = window.getComputedStyle(h1Tag);
    const isDisplayed =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0';

    const rect = h1Tag.getBoundingClientRect();
    const inViewport =
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth);

    const isVisible = isDisplayed && inViewport;

    if (!isVisible) {
        console.error('❌ <h1> is not visible in the viewport.');
        h1Tag.style.outline = '2px dashed red';
        h1Tag.title = '❌ H1 is not visible';
    } else {
        console.log('✅ <h1> is visible in the viewport.');
    }

    return isVisible;
}

/**
 * Checks the sequential order of heading tags (h1-h6).
 */
export function checkHeadingOrder(enableCheckHeadingOrder: boolean): void {
    if (!enableCheckHeadingOrder) return;

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    let issues = 0;

    headings.forEach((heading, index) => {
        const el = heading as HTMLElement;
        const currentLevel = parseInt(el.tagName.replace('H', ''), 10);
        const text = el.textContent?.trim() || '';

        if (currentLevel < lastLevel) {
            const message = `❌ Heading order issue: Found a ${el.tagName} ("${text}") after a lower level heading (H${lastLevel}).`;
            console.error(message);

            el.title = message;
            issues++;
        }

        lastLevel = currentLevel;
    });

    if (issues === 0) {
        console.log('✅ Heading order is correct (h1-h6).');
    } else {
        console.warn(`⚠️ Found ${issues} heading order issue(s).`);
    }
}

/**
 * Checks for heading level jumps or regressions.
 * E.g., h1 ➔ h4 (level jump), h4 ➔ h2 (regression)
 */
export function checkJumpLevels(enableCheckJumpLevels: boolean): void {
    if (!enableCheckJumpLevels) return;

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    let lastLevel = 0;
    let issues = 0;

    headings.forEach((heading, index) => {
        const currentLevel = parseInt(heading.tagName.replace('H', ''), 10);
        const text = heading.textContent?.trim() || '';

        if (lastLevel === 0) {
            lastLevel = currentLevel;
            return;
        }

        const levelDifference = currentLevel - lastLevel;

        if (levelDifference > 1) {
            const msg = `❌ Heading level jump detected: ${heading.tagName} ("${text}") skips levels after H${lastLevel}.`;
            console.error(msg);

            heading.style.outline = '2px dashed orange';
            heading.title = msg;
            issues++;
        } else if (levelDifference < -1) {
            const msg = `❌ Heading regression detected: ${heading.tagName} ("${text}") after a higher level heading H${lastLevel}.`;
            console.error(msg);

            heading.style.outline = '2px dashed purple';
            heading.title = msg;
            issues++;
        }

        lastLevel = currentLevel;
    });

    if (issues === 0) {
        console.log('✅ No heading level jumps or regressions detected.');
    } else {
        console.warn(`⚠️ Found ${issues} heading level jump/regression issue(s).`);
    }
}
