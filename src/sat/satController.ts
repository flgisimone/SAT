import { useSAT } from "../core/seoAccessibilityTool";
import { SATOptions } from "../satOptions";
import { resetSATStyles } from "./resetSATStyles";

export function useSATController(customOptions?: Partial<SATOptions>): void {
    const isDesktop = window.innerWidth >= 1024;

    if (!isDesktop) {
        console.warn('🖥️ SAT UI is available only on desktop.');

        return;
    }

    if (document.getElementById('sat-inject-button')) return;

    const button = document.createElement('button');

    button.id = 'sat-inject-button';
    button.textContent = 'Run SAT';
    button.role = 'button';
    button.ariaLabel = 'active-seo-accessibility-tool';
    button.ariaBrailleLabel = 'active-seo-accessibility-tool';
    button.setAttribute('data-sat-ignore', 'true');

    button.style.position = 'fixed';
    button.style.top = '35%';
    button.style.left = '2px';
    button.style.padding = '10px 16px';
    button.style.backgroundColor = 'rgba(0, 66, 128, 0.65)';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    button.style.cursor = 'pointer';
    button.style.zIndex = '10000';
    button.style.fontSize = '14px';

    let satEnabled = false;

    button.addEventListener('click', async () => {
        satEnabled = !satEnabled;

        button.textContent = satEnabled ? 'SAT: ON' : 'SAT: OFF';
        button.style.backgroundColor = satEnabled ? '#006106' : '#AD0000';

        if (satEnabled) {
            console.log('🔍 SAT Enabled!');

            try {
                await useSAT(customOptions);
            } catch (error) {
                console.error('❌ Error during SAT execution:', error);
            }
        } else {
            console.clear();
            console.log('❌ SAT Disabled');

            resetSATStyles();
        }
    });

    document.body.appendChild(button);
}
