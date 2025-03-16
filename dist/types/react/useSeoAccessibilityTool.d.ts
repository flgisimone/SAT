import { HeadingOrderOptions } from "../core/seoAccessibilityTool";
export interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}
export declare const useHeadingOrder: ({ delay, callback }?: UseHeadingOrderOptions) => void;
