export function satReset(): void {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'));

    elements.forEach(el => {
        if (el.closest('[data-sat-ignore]')) {
            return;
        }

        el.style.outline = '';
        el.style.backgroundColor = '';
        el.style.borderColor = '';
        el.title = '';
    });

    console.log('🔄 SAT styles have been reset (excluding SAT UI).');
}
