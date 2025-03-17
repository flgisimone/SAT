  <h1>SEO Accessibility Tool (SAT) 🕵️‍♂️</h1>
  <p>An accessibility and SEO validation tool focused on <strong>heading structure best practices</strong>.  
  Detects common mistakes in heading usage (h1-h6), ensuring semantic hierarchy for better accessibility and SEO performance.</p>

  <hr>

<h2>🚀 Features</h2>
  <ul>
    <li>✅ Validates the correct order of heading tags (<code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code>)</li>
    <li>✅ Detects missing or multiple <code>&lt;h1&gt;</code> tags</li>
    <li>✅ Checks if the first <code>&lt;h1&gt;</code> is <strong>visible</strong> in the viewport</li>
    <li>✅ Detects <strong>level jumps</strong> and <strong>regressions</strong> (e.g., H1 ➔ H4 without H2/H3)</li>
    <li>✅ Logs clear and actionable warnings in the browser console</li>
    <li>✅ Framework-agnostic core logic (works in <strong>React</strong> or <strong>Vue</strong>)</li>
  </ul>

  <hr>

<h2>📦 Installation</h2>
<h3>React / Vue</h3>
  <pre><code>npm install seo-accessibility-tool</code></pre>

  <hr>

<h2>🔨 How It Works</h2>
  <p><strong>SEO Accessibility Tool (SAT)</strong> provides a series of functions to check the <em>semantic correctness</em> of heading elements in the document.</p>
  <p>It helps you catch:</p>
  <ul>
    <li>Incorrect heading order</li>
    <li>Missing <code>&lt;h1&gt;</code> tags</li>
    <li>Invisible <code>&lt;h1&gt;</code> elements</li>
    <li>Level jumps or regressions in heading hierarchy</li>
  </ul>

  <hr>

<h2>✅ Available Checks</h2>

<h3>1. <code>checkH1()</code></h3>
  <p>Checks for the presence of <code>&lt;h1&gt;</code> tags in the document.</p>
  <ul>
    <li>Warns if there are <strong>no</strong> <code>&lt;h1&gt;</code> tags.</li>
    <li>Warns if there are <strong>multiple</strong> <code>&lt;h1&gt;</code> tags.</li>
  </ul>
  <pre><code>checkH1();</code></pre>

<h3>2. <code>checkH1Visible()</code></h3>
  <p>Checks if the first <code>&lt;h1&gt;</code> element in the document is visible.</p>
  <ul>
    <li>Verifies:
      <ul>
        <li><code>display</code> is not <code>none</code></li>
        <li><code>visibility</code> is not <code>hidden</code></li>
        <li><code>opacity</code> is not <code>0</code></li>
        <li>Element is inside the viewport bounds</li>
      </ul>
    </li>
  </ul>
  <pre><code>const isVisible = checkH1Visible();</code></pre>

<h3>3. <code>checkHeadingOrder()</code></h3>
  <p>Checks if headings (<code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code>) follow a <strong>sequential and descending order</strong>.</p>
  <ul>
    <li>Warns if a heading appears <strong>out of order</strong> (e.g., H3 after H1 without an H2).</li>
    <li>Resets previous visual warnings (removes outlines and tooltips).</li>
  </ul>
  <pre><code>checkHeadingOrder();</code></pre>

<h3>4. <code>checkJumpLevels()</code></h3>
  <p>Detects:</p>
  <ul>
    <li><strong>Level jumps</strong> (e.g., H1 ➔ H4 without H2/H3)</li>
    <li><strong>Regressions</strong> (e.g., H4 ➔ H2 unexpectedly)</li>
  </ul>
  <p>Logs detailed warnings in the console.</p>
  <pre><code>checkJumpLevels();</code></pre>

<h3>5. <code>useSAT()</code></h3>
  <p>Runs all checks together:</p>
  <pre><code>useSAT();</code></pre>
  <ul>
    <li>Checks heading order</li>
    <li>Checks presence of <code>&lt;h1&gt;</code></li>
    <li>Checks visibility of <code>&lt;h1&gt;</code></li>
    <li>Checks heading level jumps/regressions</li>
  </ul>

  <hr>

<h2>📝 Example Usage</h2>

<h3>React</h3>
  <pre><code>import { useEffect } from 'react';
import {useSATReact} from 'seo-accessibility-tool/react';

export default function App() {
  useEffect(() =&gt; {
    useSATReact();  // Run the checks when the component mounts
  }, []);

  return (
    &lt;div&gt;
      &lt;h1&gt;Main Page&lt;/h1&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h3>Vue 3 / Nuxt</h3>
  <pre><code>&lt;script setup&gt;
import { onMounted } from 'vue';
import {useSATVue} from 'seo-accessibility-tool/vue';

onMounted(() =&gt; {
	useSATVue(); // Run the checks when the component mounts
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;Main Page&lt;/h1&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

  <hr>

<h2>❗ Example Warning Messages</h2>
  <pre><code>⚠️ H1 not found
⚠️ Multiple h1 found
⚠️ Heading order issue: Found a H3 ("Subheading") after a heading of lower level (H1)
⚠️ Heading level jump detected: Found H4 skipping levels after H1</code></pre>

  <hr>

<h2>📚 Project Structure Overview</h2>
  <pre><code>/src/
├── core/                      
│   ├── seoAccessibilityTool.ts
├── react/                     
│   └── useSeoAccessibilityTool.tsx
└── vue/                       
    └── useSeoAccessibilityTool.ts</code></pre>

  <hr>

<h2>📄 License</h2>
  <p>MIT License © 2025 Giulio Simone Floresta</p>

  <hr>

<h2>✅ What's Next?</h2>
  <ul>
    <li>Dashboard</li>
    <li>Export reports (JSON/CSV)</li>
  </ul>