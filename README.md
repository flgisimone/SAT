  <h1>SEO Accessibility Tool (SAT) 🕵️‍♂️ for Developer</h1>
  <p>An accessibility and SEO validation tool for detects common mistakes in accessibility and SEO performance.</p>

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
  useSATReact({
    enable: true,
    options: {
      enableCheckH1: true,
      enableCheckAriaRolesWithSuggestions: false,
      enableCheckColorContrast: true
    }
  });

  return ();
}};
</code></pre>

<h3>Vue 3 / Nuxt</h3>
<pre><code>
&lt;script setup lang="ts"&gt;
import { useSATVue } from 'seo-accessibility-tool/vue';

useSATVue({
  enable: true,
  options: {
    enableCheckH1: true,
    enableCheckFocusManagement: true,
    enableCheckExternalLinksRel: true
  }
});
&lt;/script&gt;

&lt;template&gt;
  &lt;NuxtLayout&gt;
    &lt;NuxtPage /&gt;
  &lt;/NuxtLayout&gt;
&lt;/template&gt;
</code></pre>

<hr>
<h2>✅ Accessibility Checks Summary</h2>

<table>
  <thead>
    <tr>
      <th>Check Description</th>
      <th>Status</th>
      <th>Tag/Element Involved</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Validates correct order of headings (&lt;h1&gt; to &lt;h6&gt;)</td>
      <td>✅</td>
      <td>h1 - h6</td>
    </tr>
    <tr>
      <td>Detects missing or multiple &lt;h1&gt; tags</td>
      <td>✅</td>
      <td>h1</td>
    </tr>
    <tr>
      <td>Checks if the first &lt;h1&gt; is visible in the viewport</td>
      <td>✅</td>
      <td>h1</td>
    </tr>
    <tr>
      <td>Detects heading level jumps or regressions (e.g., H1 ➔ H4)</td>
      <td>✅</td>
      <td>h1 - h6</td>
    </tr>
    <tr>
      <td>Validates accessible <strong>ARIA labels</strong> on interactive elements</td>
      <td>✅</td>
      <td>button, a, input, svg</td>
    </tr>
    <tr>
      <td>Checks <strong>ARIA roles</strong> for correctness and provides suggestions</td>
      <td>✅</td>
      <td>Elements with role attributes</td>
    </tr>
    <tr>
      <td>Verifies landmark elements are unique (e.g., &lt;main&gt;, &lt;nav&gt;)</td>
      <td>✅</td>
      <td>main, nav, header, footer</td>
    </tr>
    <tr>
      <td>Checks color contrast ratios for WCAG 2.1 AA/AAA compliance</td>
      <td>✅</td>
      <td>h1-h6, span, a, button</td>
    </tr>
    <tr>
      <td>Verifies input fields have associated labels</td>
      <td>✅</td>
      <td>input, textarea, select</td>
    </tr>
    <tr>
      <td>Checks focus management and tabindex usage</td>
      <td>✅</td>
      <td>Interactive elements</td>
    </tr>
    <tr>
      <td>Warns about links with empty or non-descriptive text</td>
      <td>✅</td>
      <td>a</td>
    </tr>
    <tr>
      <td>Detects links with href="#" or empty href</td>
      <td>✅</td>
      <td>a</td>
    </tr>
    <tr>
      <td>Ensures external links (target="_blank") have rel="noopener noreferrer"</td>
      <td>✅</td>
      <td>a (target="_blank")</td>
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
