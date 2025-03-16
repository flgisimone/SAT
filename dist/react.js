import { useEffect } from 'react';
import { checkHeadingOrder } from './index.js';

const useHeadingOrder = ({ delay = 100, callback } = {}) => {
    useEffect(() => {
        checkHeadingOrder();
        const timeout = setTimeout(() => {
            checkHeadingOrder();
        }, delay);
        return () => clearTimeout(timeout);
    }, []);
};

export { useHeadingOrder };
