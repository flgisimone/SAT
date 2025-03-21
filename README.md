  <h1>SEO Accessibility Tool (SAT) 🕵️‍♂️</h1>
  <p>An accessibility and SEO validation tool focused on <strong>heading structure best practices</strong>.  
  Detects common mistakes in heading usage (h1-h6), ensuring semantic hierarchy for better accessibility and SEO performance.</p>

  <hr>

<h2>🚀 Features</h2>
<ul> <li>✅ Validates the correct order of heading tags (<code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code>)</li> <li>✅ Detects missing or multiple <code>&lt;h1&gt;</code> tags</li> <li>✅ Checks if the first <code>&lt;h1&gt;</code> is <strong>visible</strong> in the viewport</li> <li>✅ Detects <strong>level jumps</strong> and <strong>regressions</strong> (e.g., H1 ➔ H4 without H2/H3)</li> <li>✅ Validates accessible <strong>ARIA labels</strong> on interactive elements (<code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;input&gt;</code>, <code>&lt;svg&gt;</code>)</li> <li>✅ Checks <strong>ARIA roles</strong> for correctness and provides semantic suggestions</li> <li>✅ Verifies <strong>landmark elements</strong> (e.g., <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>) are unique or properly labeled</li> <li>✅ Checks <strong>color contrast</strong> ratios for text readability and WCAG 2.1 compliance (AA/AAA)</li> <li>✅ Logs clear and actionable warnings in the browser console</li> <li>✅ Framework-agnostic core logic (works in <strong>React</strong> and <strong>Vue</strong>)</li> </ul>

  <hr>

<h2>🎨 Visual Highlights</h2>
<ul>
<li>🔴 Red Outline	Issues in heading structure or insufficient color contrast (fails AA/AAA)</li>
<li>🟠 Orange Outline	Duplicated landmarks without aria-label or aria-labelledby</li>
<li>🟣 Purple Outline	Invalid or missing ARIA roles</li>
</ul>


<hr>

<h2>📦 Installation</h2>
<h3>React / Vue</h3>
  <pre><code>npm install seo-accessibility-tool</code></pre>

  <hr>
<h2>⚙️ Configuration & Environment Notes</h2>
<h3>➡️ How to Enable It</h3>
You must pass the prop mode to activate the tool:
<pre><code>useSATReact({ enable: true });
</code></pre>
<pre><code>useSATVue({ enable: true });</code></pre>
<ul>
<li>enable: true ➔ Enables SAT</li>
<li>enable: false ➔ Disables SAT</li>
<li>Optional prop delay (number, in ms): Debounces validations (default: 100)</li>
</ul>

<h3>➡️ Behavior in Production</h3>
We recommend activating SAT only in development, for debugging accessibility and SEO during the build process.

Example conditional activation in Vue:
<pre><code>if (process.env.NODE_ENV !== 'production') {
  useSATVue({ mode: true });
}</code></pre>
<hr>

<h2>📝 Example Usage</h2>

<h3>React</h3>
  <pre><code>
import {useSATReact} from 'seo-accessibility-tool/react';

export default function App() {
    useSATVue({enable: true});
}</code></pre>

<h3>Vue 3 / Nuxt</h3>
  <pre><code>&lt;script setup&gt;
import {useSATVue} from 'seo-accessibility-tool/vue';

    useSATVue({enable: true});
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;Main Page&lt;/h1&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

  <hr>

<h2>📄 License</h2>
  <p>MIT License © 2025 Giulio Simone Floresta</p>

  <hr>

<h2>📚 References</h2>
  <ul>
    <li>WCAG 2.1 Guidelines</li>
    <li>WAI-ARIA Authoring Practices</li>
  </ul>
