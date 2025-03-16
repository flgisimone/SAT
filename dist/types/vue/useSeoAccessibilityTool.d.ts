import { HeadingOrderOptions } from "../core/seoAccessibilityTool";
export interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}
export declare function useHeadingOrder({ delay, callback }?: UseHeadingOrderOptions): void;
