import type { Rule } from './rule';
import { h1 } from './seo/h1';
import { h1Visible } from './seo/h1-visible';
import { headingOrder } from './a11y/heading-order';
import { headingLevels } from './a11y/heading-levels';
import { accessibleName } from './a11y/accessible-name';
import { ariaRoles } from './a11y/aria-roles';
import { landmarks } from './a11y/landmarks';
import { colorContrast } from './a11y/color-contrast';
import { formLabel } from './a11y/form-label';
import { focusManagement } from './a11y/focus-management';
import { imageAlt } from './a11y/image-alt';
import { linkHref } from './a11y/link-href';
import { linkTargetBlank } from './seo/link-target-blank';
import { tabindexNegative } from './a11y/tabindex-negative';
import { linkText } from './a11y/link-text';
import { htmlLang } from './a11y/html-lang';
import { seoMeta } from './seo/seo-meta';
import { canonical } from './seo/canonical';
import { robotsMeta } from './seo/robots-meta';
import { socialMeta } from './seo/social-meta';
import { hreflang } from './seo/hreflang';
import { structuredData } from './seo/structured-data';
import { mixedContent } from './seo/mixed-content';
import { imageSize } from './seo/image-size';
import { imageLazyLoad } from './seo/image-lazy-load';
import { linkBroken } from './seo/link-broken';

export type { Rule, RuleContext, RuleId, Report, WcagLevel } from './rule';

/** Every rule, in the order the results are listed. */
export const rules: Rule[] = [
    h1,
    h1Visible,
    headingOrder,
    headingLevels,
    accessibleName,
    ariaRoles,
    landmarks,
    colorContrast,
    formLabel,
    focusManagement,
    imageAlt,
    linkHref,
    linkTargetBlank,
    tabindexNegative,
    linkText,
    htmlLang,
    seoMeta,
    canonical,
    robotsMeta,
    socialMeta,
    hreflang,
    structuredData,
    mixedContent,
    imageSize,
    imageLazyLoad,
    linkBroken,
];
