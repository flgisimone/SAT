import type { Issue } from '../sat/issue';
import { icon } from './icons';

/**
 * Boxes drawn over the page on SAT's own layer: the page's elements are never changed,
 * so the app's re-renders can't erase them and turning SAT off leaves nothing behind.
 * Pointing at a box (hover, or a click or tap) shows a tag with the severity and title of its issues.
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
    issue?: Issue;
    rect?: DOMRect;
}

const FLASH: Keyframe[] = [{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }];
const FLASH_TIME = 1200;
/** Titles listed in the tag before "+N more". */
const TAG_LINES = 3;
const GAP = 4;

function createBox(className: string): HTMLDivElement {
    const box = document.createElement('div');
    box.className = `box ${className}`;
    return box;
}

function contains(rect: DOMRect, x: number, y: number): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/** `ui`: SAT's host element; pointing at SAT's own UI hides the tag. */
export function createOverlay(layer: HTMLElement, ui: Element): Overlay {
    const pulseBox = createBox('pulse');
    pulseBox.hidden = true;
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.hidden = true;
    layer.append(pulseBox, tag);

    let tracked: Tracked[] = [];
    let pulse: Tracked | null = null;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    let tagged: Element | null = null;
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
            entry.rect = rect;
            entry.box.hidden = !rect || (rect.width === 0 && rect.height === 0);
            if (rect) {
                Object.assign(entry.box.style, { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            }
        }
        placeTag();
    }

    /** The tag of the smallest box under the pointer, above it (below when there's no room), inside the viewport. */
    function placeTag() {
        const hits = pointer ? tracked.filter((entry) => !entry.box.hidden && entry.rect && contains(entry.rect, pointer!.x, pointer!.y)) : [];
        if (hits.length === 0) {
            tag.hidden = true;
            tagged = null;
            return;
        }

        const area = (entry: Tracked) => entry.rect!.width * entry.rect!.height;
        const target = hits.reduce((a, b) => (area(b) < area(a) ? b : a));
        if (target.element !== tagged) {
            tagged = target.element;
            const byRule = new Map<string, Issue>();
            tracked.forEach(({ element, issue }) => {
                if (element === target.element && issue && !byRule.has(issue.ruleId)) byRule.set(issue.ruleId, issue);
            });
            const lines = Array.from(byRule.values());
            tag.replaceChildren(...lines.slice(0, TAG_LINES).map((issue) => {
                const line = document.createElement('div');
                line.append(icon(issue.severity), `${issue.severity === 'error' ? 'Error' : 'Warning'} · ${issue.title ?? issue.ruleId}`);
                return line;
            }));
            if (lines.length > TAG_LINES) tag.append(`+${lines.length - TAG_LINES} more`);
        }

        tag.hidden = false;
        const rect = target.rect!;
        const { width, height } = tag.getBoundingClientRect();
        const above = rect.top - height - GAP;
        const top = above >= 0 ? above : Math.min(rect.bottom + GAP, innerHeight - height);
        const left = Math.min(Math.max(rect.left, GAP), innerWidth - width - GAP);
        Object.assign(tag.style, { top: `${Math.max(top, 0)}px`, left: `${Math.max(left, 0)}px` });
    }

    function onPointer(event: Event) {
        const { clientX: x, clientY: y } = event as MouseEvent; // pointermove and click
        pointer = event.composedPath().includes(ui) ? null : { x, y };
        schedule();
    }

    function onLeave() {
        pointer = null;
        schedule();
    }

    function listen(on: boolean) {
        const method = on ? 'addEventListener' : 'removeEventListener';
        window[method]('scroll', schedule, true); // capture: scrolling inside any container moves the boxes too
        window[method]('resize', schedule);
        window[method]('pointermove', onPointer, { capture: true, passive: true });
        window[method]('click', onPointer, { capture: true, passive: true });
        document.documentElement[method]('pointerleave', onLeave);
    }

    function removeBoxes() {
        tracked = [];
        tagged = null;
        tag.hidden = true;
        resizeObserver.disconnect();
        layer.replaceChildren(pulseBox, tag);
    }

    return {
        show(issues) {
            removeBoxes();
            tracked = issues.flatMap((issue) => (issue.element ? [{ element: issue.element, selector: issue.selector, box: createBox(issue.severity), issue }] : []));
            pulseBox.before(...tracked.map((entry) => entry.box));
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
            const done = () => {
                if (pulse !== entry) return;
                pulse = null;
                pulseBox.hidden = true;
            };
            // With reduced motion the box stays still for the same time instead of flashing.
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(done, FLASH_TIME);
            else pulseBox.animate(FLASH, { duration: FLASH_TIME / 3, iterations: 3 }).finished.then(done, () => {});
        },

        clear() {
            removeBoxes();
            pulse = null;
            pulseBox.hidden = true;
            pointer = null;
            listen(false);
        },
    };
}
