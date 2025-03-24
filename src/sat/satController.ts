import { useSAT } from "../core/seoAccessibilityTool";
import { SATOptions } from "../satOptions";
import { resetSATStyles } from "./resetSATStyles";

export function useSATController(customOptions?: Partial<SATOptions>): void {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    const isDesktop = window.innerWidth >= 1024;

    if (!isDesktop) {
        console.warn('🖥️ SAT UI is available only on desktop.');

        return;
    }

    if (document.getElementById('sat-inject-button')) return;

    const wrapper = document.createElement("div");

    wrapper.style.position = "fixed";
    wrapper.style.top = '35%';
    wrapper.style.left = '2px';
    wrapper.style.zIndex = '10000';
    wrapper.setAttribute('data-sat-ignore', 'true');

    const runButton = document.createElement('button');

    runButton.id = 'sat-run-button';
    runButton.textContent = 'Run SAT';
    runButton.role = 'button';
    runButton.ariaLabel = 'active-seo-accessibility-tool';
    runButton.ariaBrailleLabel = 'active-seo-accessibility-tool';
    runButton.setAttribute('data-sat-ignore', 'true');

    runButton.style.padding = '10px 16px';
    runButton.style.backgroundColor = 'rgba(0, 66, 128, 0.65)';
    runButton.style.color = '#fff';
    runButton.style.border = 'none';
    runButton.style.borderRadius = '5px';
    runButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    runButton.style.cursor = 'pointer';
    runButton.style.zIndex = '10000';
    runButton.style.fontSize = '14px';

    const reloadButton = document.createElement('button');

    reloadButton.id = 'sat-reload-button';
    reloadButton.textContent = 'Reload 🔃';
    reloadButton.role = 'button';
    reloadButton.ariaLabel = 'reload-seo-accessibility-tool';
    reloadButton.ariaBrailleLabel = 'reload-seo-accessibility-tool';
    reloadButton.setAttribute('data-sat-ignore', 'true');

    reloadButton.style.marginTop = '8px';
    reloadButton.style.padding = '10px 16px';
    reloadButton.style.backgroundColor = '#575757';
    reloadButton.style.color = '#fff';
    reloadButton.style.border = 'none';
    reloadButton.style.borderRadius = '5px';
    reloadButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    reloadButton.style.cursor = 'pointer';
    reloadButton.style.zIndex = '10000';
    reloadButton.style.fontSize = '14px';

    let satEnabled = false;

    runButton.addEventListener('click', async () => {
        satEnabled = !satEnabled;

        runButton.textContent = satEnabled ? 'SAT: ON' : 'SAT: OFF';
        runButton.style.backgroundColor = satEnabled ? '#006106' : '#AD0000';

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

    reloadButton.addEventListener('click',  () => {
        window.location.reload();
    })

    wrapper.append(runButton);
    wrapper.append(reloadButton);
    document.body.appendChild(wrapper);
}
