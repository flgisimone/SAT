  <h1>SEO Accessibility Tool (SAT) 🕵️‍♂️ for Developer</h1>
  An accessibility and SEO validation tool focused on <strong>heading structure best practices</strong> 
  and <strong>universal accessibility compliance</strong>.  
  Detects common mistakes in heading usage (h1-h6), ARIA, color contrast, and more to ensure semantic hierarchy for better accessibility and SEO performance.
</p>

  <hr>

<h2>🚀 Features</h2>
<ul>
  <li>✅ Validates the correct order of heading tags (<code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code>)</li>
  <li>✅ Detects missing or multiple <code>&lt;h1&gt;</code> tags</li>
  <li>✅ Checks if the first <code>&lt;h1&gt;</code> is <strong>visible</strong> in the viewport</li>
  <li>✅ Detects <strong>level jumps</strong> and <strong>regressions</strong> (e.g., H1 ➔ H4 without H2/H3)</li>
  <li>✅ Validates accessible <strong>ARIA labels</strong> on interactive elements (<code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;input&gt;</code>, <code>&lt;svg&gt;</code>)</li>
  <li>✅ Checks <strong>ARIA roles</strong> for correctness and provides semantic suggestions</li>
  <li>✅ Verifies <strong>landmark elements</strong> (e.g., <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>) are unique or properly labeled</li>
  <li>✅ Checks <strong>color contrast</strong> ratios for text readability and WCAG 2.1 compliance (AA/AAA)</li>
  <li>✅ Ensures <strong>input fields</strong> are properly associated with a <code>&lt;label&gt;</code> for better accessibility and screen reader support</li>
  <li>✅ Validates <strong>focus management</strong> on interactive elements (proper <code>tabindex</code> usage and accessibility focus order)</li>
  <li>✅ Detects <strong>empty or invalid links</strong> (e.g., <code>&lt;a href="#"&gt;</code> or no <code>href</code>) and suggests better alternatives</li>
  <li>✅ Detects empty or invalid <code>href="#"</code> links without a meaningful destination</li>
  <li>✅ Checks external links (<code>target="_blank"</code>) for missing <code>rel="noopener noreferrer"</code> to prevent tabnabbing attacks</li>
  <li>✅ Supports <strong>custom allowed link texts</strong> to skip warnings (e.g., "read more")</li>
  <li>✅ Logs clear and actionable warnings in the browser console</li>
  <li>✅ Framework-agnostic core logic (works in <strong>React</strong> and <strong>Vue</strong>)</li>
</ul>

<hr>

<h2>📦 Installation</h2>
<h3>React / Vue</h3>
  <pre><code>npm install seo-accessibility-tool</code></pre>

  <hr>
<h2>⚙️ Configuration & Environment Notes</h2>
<h3>➡️ How to Enable It</h3>
You must pass the prop mode to activate the tool:
<pre><code>useSATReact(enable);
</code></pre>
<pre><code>useSATVue(enable);</code></pre>
<ul>
<li>enable: true ➔ Enables SAT</li>
<li>enable: false ➔ Disables SAT</li>
<li>Optional prop delay (number, in ms): Debounces validations (default: 100)</li>
</ul>

<hr>

<h2>⚙️ Advanced Usage with SAT Options</h2>
You can selectively enable or disable specific checks using the SATOptions interface.

<h3>Example with Custom Options (Vanilla)</h3>
<pre><code>
import { useSAT } from 'seo-accessibility-tool';

// You can pass a second parameter as custom options
useSAT(true, {
  enableCheckH1: true,
  enableCheckH1Visible: false, // disable H1 visibility check
  enableCheckHeadingOrder: true,
  enableCheckJumpLevels: false, // disable heading jumps check
  enableCheckTextElementContrast: true,
  enableCheckAriaLabel: true,
  enableCheckAriaRolesWithSuggestions: true,
  enableCheckUniqueLandmarks: true,
  enableCheckInputLabel: true,
  enableCheckFocusManagement: true,
  enableCheckEmptyLinks: true,
  enableCheckTabindexNegativeOne: true
});

</code></pre>

<h3>SATOptions (Defaults)</h3>
<pre><code>
const satOptions = {
  enableCheckH1: true,
  enableCheckH1Visible: true,
  enableCheckHeadingOrder: true,
  enableCheckJumpLevels: true,
  enableCheckTextElementContrast: true,
  enableCheckAriaLabel: true,
  enableCheckAriaRolesWithSuggestions: true,
  enableCheckUniqueLandmarks: true,
  enableCheckInputLabel: true,
  enableCheckFocusManagement: true,
  enableCheckEmptyLinks: true,
  enableCheckTabindexNegativeOne: true
};
</code></pre>

<h4>When to Use Custom Options?</h4>
<li>If you want to fix one issue at a time, you can enable only the relevant checks</li>
<li>Helps in progressive debugging without cluttering the console with multiple warnings</li>
<ul>
</ul>
<hr>

<h2>📝 Example Usage</h2>

<h3>React</h3>
<pre><code>
import { useSATReact } from 'seo-accessibility-tool/react';

export default function App() {
  useSATReact(true, {
    allowedLinkTexts: ['read more', 'discover more'],
    enableCheckNonDescriptiveLinks: true
  });

  return ();
}};
</code></pre>

<h3>Vue 3 / Nuxt</h3>
<pre><code>
&lt;script setup lang="ts"&gt;
import { useSATVue } from 'seo-accessibility-tool/vue';

useSATVue(true, {
  allowedLinkTexts: ['read more', 'click here'],
  enableCheckNonDescriptiveLinks: true
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;Main Page&lt;/h1&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre>

<hr>
<h2>✅ Accessibility Checks Summary</h2>

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>enableCheckH1</code></td>
      <td>Check for missing/multiple H1 tags</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckH1Visible</code></td>
      <td>Check if H1 is visible in viewport</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckHeadingOrder</code></td>
      <td>Validate heading order hierarchy</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckJumpLevels</code></td>
      <td>Detect heading level jumps/regressions</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckAriaLabel</code></td>
      <td>Validate ARIA labels on interactive elements</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckAriaRolesWithSuggestions</code></td>
      <td>Check ARIA roles and suggest improvements</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckUniqueLandmarks</code></td>
      <td>Ensure unique landmark elements (main, nav, etc.)</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckTextElementContrast</code></td>
      <td>Check color contrast of text for WCAG compliance</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckInputLabel</code></td>
      <td>Verify input fields have associated labels</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckFocusManagement</code></td>
      <td>Validate focus and tabindex management</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckEmptyLinks</code></td>
      <td>Detect links without destinations (empty href or #)</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckExternalLinksRel</code></td>
      <td>Check external links for missing rel="noopener noreferrer"</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>enableCheckNonDescriptiveLinks</code></td>
      <td>Warn on links with nondescriptive text</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>allowedLinkTexts</code></td>
      <td>Allowed link texts (skip warnings on these)</td>
      <td><code>[]</code></td>
    </tr>
  </tbody>
</table>

<h2>📌 Example Usage Options Table (SATOptions)</h2>

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>enableCheckH1</td>
      <td>Validate if there's exactly one &lt;h1&gt; tag on the page</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckH1Visible</td>
      <td>Verify the first &lt;h1&gt; is visible in the viewport</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckHeadingOrder</td>
      <td>Check if heading levels follow the correct hierarchical order</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckJumpLevels</td>
      <td>Detect jumps or regressions in heading levels</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckTextElementContrast</td>
      <td>Validate text contrast ratio meets WCAG 2.1 AA/AAA</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckAriaLabel</td>
      <td>Ensure interactive elements have aria-label or descriptive text</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckAriaRolesWithSuggestions</td>
      <td>Verify role attributes are correct and suggest improvements</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckUniqueLandmarks</td>
      <td>Check that landmark roles (e.g., &lt;main&gt;) appear only once</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckInputLabel</td>
      <td>Ensure form inputs have associated &lt;label&gt; elements</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckFocusManagement</td>
      <td>Validate focusability and tabindex usage on interactive elements</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckEmptyLinks</td>
      <td>Detect anchor tags with empty href or # placeholders</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckExternalLinksRel</td>
      <td>Ensure external links use rel="noopener noreferrer"</td>
      <td>true</td>
    </tr>
    <tr>
      <td>enableCheckTabindexNegativeOne</td>
      <td>Check for misuse of tabindex="-1" in focusable elements</td>
      <td>true</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>📄 License</h2>
  <p>MIT License © 2025 Giulio Simone Floresta</p>

  <hr>

<h2>📚 References</h2>
  <ul>
    <li>WCAG 2.1 Guidelines</li>
    <li>WAI-ARIA Authoring Practices</li>
  </ul>
