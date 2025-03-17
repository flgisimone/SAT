interface HeadingOrderOptions {
    callback?: (message: string, context: {
        tag: string;
        text: string;
        lastLevel: number;
    }) => void;
}
declare function useSAT(options?: HeadingOrderOptions): void;

export { type HeadingOrderOptions, useSAT };
