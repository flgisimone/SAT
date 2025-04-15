import {logError} from "../../sat/satLogger";

export function checkH1(enableCheckH1?: boolean): void {
    if (!enableCheckH1) return;

    const h1Count = document.querySelectorAll('h1');

    const message = {
        messageMultipleH1: `Multiple <h1> found on the page.`,
        messageH1NotFound: `No <h1> found on the page.`,
    };

    if (h1Count.length > 1) {
        logError(message.messageMultipleH1);
    } else if (h1Count.length === 0) {
        logError(message.messageH1NotFound);
    }

    h1Count.forEach(h1 => {
        const el = h1 as HTMLElement;
        el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        el.style.outline = '2px solid red';
    });
}

export function checkH1Visible(enableCheckH1Visible: boolean): boolean {
    if (!enableCheckH1Visible) return false;

    const h1Tag: HTMLHeadingElement | null = document.querySelector('h1');

    if (!h1Tag) {
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

    return isDisplayed && inViewport;
}

export function checkHeadingOrder(enableCheckHeadingOrder: boolean): void {
    if (!enableCheckHeadingOrder) return;

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    let lastLevel = 0;

    // Reset styles
    headings.forEach((heading) => {
        const el = heading as HTMLElement;
        el.style.outline = '';
        el.style.backgroundColor = '';
        el.removeAttribute('title');
    });

    headings.forEach((heading) => {
        const el = heading as HTMLElement;
        const currentLevel = parseInt(el.tagName.replace('H', ''), 10);
        const text = el.textContent?.trim() || '';

        if (currentLevel < lastLevel) {
            const msg = `Heading order issue: Found a ${el.tagName} ("${text}") after a heading of lower level (H${lastLevel}).`;
            logError(msg);
            el.title = msg;
        }

        // Style per livello
        switch (el.tagName.toLowerCase()) {
            case 'h1':
                el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                el.style.outline = '2px solid red';
                break;
            case 'h2':
                el.style.backgroundColor = 'rgba(255, 165, 0, 0.1)';
                el.style.outline = '2px solid orange';
                break;
            case 'h3':
                el.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
                el.style.outline = '2px solid yellow';
                break;
            case 'h4':
                el.style.backgroundColor = 'rgba(0, 128, 0, 0.1)';
                el.style.outline = '2px solid green';
                break;
            case 'h5':
                el.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
                el.style.outline = '2px solid blue';
                break;
            case 'h6':
                el.style.backgroundColor = 'rgba(128, 0, 128, 0.1)';
                el.style.outline = '2px solid purple';
                break;
        }

        lastLevel = currentLevel;
    });
}

export function checkJumpLevels(enableCheckJumpLevels: boolean): void {
    if (!enableCheckJumpLevels) return;

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];

    let lastLevel = 0;

    headings.forEach((heading) => {
        const currentLevel = parseInt(heading.tagName.replace('H', ''), 10);
        const text = heading.textContent?.trim() || '';

        if (lastLevel === 0) {
            lastLevel = currentLevel;
            return;
        }

        const levelDifference = currentLevel - lastLevel;

        if (levelDifference > 1) {
            logError(`Heading level jump detected: Found ${heading.tagName} ("${text}") skipping levels after H${lastLevel}.`);
        } else if (levelDifference < -1) {
            logError(`Heading regression detected: Found ${heading.tagName} ("${text}") after a higher level heading (H${lastLevel}).`);
        }

        lastLevel = currentLevel;
    });
}
