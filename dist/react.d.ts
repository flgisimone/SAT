interface HeadingOrderOptions {
    callback?: (message: string, context: {
        tag: string;
        text: string;
        lastLevel: number;
    }) => void;
}

interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}
declare const seoAccessibilityTool: ({ delay, callback }?: UseHeadingOrderOptions) => void;

export { type UseHeadingOrderOptions, seoAccessibilityTool as default, seoAccessibilityTool };
