import { onMounted, onUnmounted } from 'vue';
import { checkHeadingOrder } from './index.js';

function useHeadingOrder({ delay = 100, callback } = {}) {
    let timeout;
    onMounted(() => {
        checkHeadingOrder();
        timeout = window.setTimeout(() => {
            checkHeadingOrder();
        }, delay);
    });
    onUnmounted(() => {
        clearTimeout(timeout);
    });
}

export { useHeadingOrder };
