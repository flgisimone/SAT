import type { Issue } from '../sat/issue';

/**
 * Boxes drawn over the page on SAT's own layer: the page's elements are never changed,
 * so the app's re-renders can't erase them and turning SAT off leaves nothing behind.
 */
export interface Overlay {
    show(issues: Issue[]): void;
    /** Scrolls to the element, focuses it if it can take focus, and flashes a box on it. */
    reveal(element: Element): void;
    clear(): void;
}

interface Tracked {
    element: Element;
    selector?: string;
    box: HTMLElement;
}

const FLASH: Keyframe[] = [{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }];

function createBox(className: string): HTMLDivElement {
    const box = document.createElement('div');
    box.className = `box ${className}`;
    return box;
}

export function createOverlay(layer: HTMLElement): Overlay {
    const pulseBox = createBox('pulse');
    pulseBox.hidden = true;
    layer.append(pulseBox);

    let tracked: Tracked[] = [];
    let pulse: Tracked | null = null;
    let frame = 0;
    const resizeObserver = new ResizeObserver(schedule);

    function schedule() {
        frame ||= requestAnimationFrame(place);
    }

    /** When the app replaced the element (a re-render with a new node), follows the node now at its place. */
    function current(entry: Tracked): Element | null {
        if (entry.element.isConnected) return entry.element;
        const replacement = entry.selector ? document.querySelector(entry.selector) : null;
        if (replacement) {
            entry.element = replacement;
            resizeObserver.observe(replacement);
        }
        return replacement;
    }

    function place() {
        frame = 0;
        for (const entry of pulse ? [...tracked, pulse] : tracked) {
            const rect = current(entry)?.getBoundingClientRect();
            entry.box.hidden = !rect || (rect.width === 0 && rect.height === 0);
            if (rect) {
                Object.assign(entry.box.style, { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            }
        }
    }

    function listen(on: boolean) {
        const method = on ? 'addEventListener' : 'removeEventListener';
        window[method]('scroll', schedule, true); // capture: scrolling inside any container moves the boxes too
        window[method]('resize', schedule);
    }

    function removeBoxes() {
        tracked = [];
        resizeObserver.disconnect();
        layer.replaceChildren(pulseBox);
    }

    return {
        show(issues) {
            removeBoxes();
            tracked = issues.flatMap(({ element, selector, severity }) => (element ? [{ element, selector, box: createBox(severity) }] : []));
            layer.append(...tracked.map((entry) => entry.box));
            tracked.forEach((entry) => resizeObserver.observe(entry.element));
            resizeObserver.observe(document.documentElement); // content added above moves everything below
            listen(true);
            place();
        },

        reveal(element) {
            element.scrollIntoView({ block: 'center' });
            (element as HTMLElement).focus?.({ preventScroll: true });
            const entry = { element, box: pulseBox };
            pulse = entry;
            listen(true);
            place();
            pulseBox.animate(FLASH, { duration: 400, iterations: 3 }).finished.then(() => {
                if (pulse !== entry) return;
                pulse = null;
                pulseBox.hidden = true;
            }, () => {});
        },

        clear() {
            removeBoxes();
            pulse = null;
            pulseBox.hidden = true;
            listen(false);
        },
    };
}
