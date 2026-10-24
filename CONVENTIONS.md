# SAT Engineering Conventions

## 1. Purpose and Scope

This document defines the mandatory engineering conventions for implementing and modifying the SEO Accessibility Tool (SAT) library.

It is the central source of truth for coding standards, architectural decisions, implementation practices, and quality expectations.

The goal is to produce code that is maintainable, readable, type-safe, testable, accessible, and consistent with the existing application without introducing unnecessary abstractions or complexity.

These conventions apply to human developers and AI coding agents.

### Rule Categories

- **Universal:** Applies to every relevant task, regardless of the technology involved.
- **Conditional:** Applies when a specific technology, feature, or situation is involved.
- **Repository-specific:** Must follow the actual project structure, dependencies, configuration, and established patterns.

Universal rules must not be used to justify ignoring a valid repository-specific constraint. Conditional rules apply only when relevant.

When a rule cannot reasonably be followed, document the reason and choose the smallest safe alternative.

## 2. Mandatory Agent Workflow

AI agents MUST follow this workflow before and during implementation.

### 2.1 Read the Instructions

Before modifying code:

1. Read this document in full, including relevant conditional rules.
2. Read applicable repository and directory-level instructions.
3. Inspect the task description, acceptance criteria, constraints, and expected behavior.
4. Identify relevant scripts, configurations, dependencies, tests, and existing implementations.

Do not assume that a convention, library, script, or configuration exists merely because it is described in documentation.

### 2.2 Understand the Existing Code

Before implementing a solution:

- Inspect the relevant files and their dependencies.
- Find existing checks, DOM helpers (`src/sat/satDom.ts`), types, and utilities that may already solve the problem.
- Understand how results flow from the checks to the logger, the UI and the integrations.
- Identify shared components and potential regression risks.
- Follow established patterns unless there is a concrete reason to change them.

Do not introduce a new architectural pattern simply because it is familiar or theoretically preferable.

### 2.3 Clarify Substantial Ambiguities

Proceed independently when requirements are sufficiently clear and implementation choices are low-risk and reversible.

Ask for clarification when an unresolved ambiguity could materially affect:

- User-visible behavior or acceptance criteria.
- Data integrity or security.
- API contracts or authentication behavior.
- Architecture, compatibility, or implementation scope.

Do not block progress on minor details that can be resolved consistently with existing project conventions.

Never silently change the public API, the default options or the severity of a check.

### 2.4 Implement the Smallest Coherent Solution

Implement the smallest coherent solution that fully satisfies the task requirements.

- Prefer existing infrastructure and established patterns.
- Avoid unrelated refactoring and speculative improvements.
- Do not add unnecessary dependencies, abstraction layers, files, or configuration.
- Preserve existing behavior unless the task requires a change or a directly related defect must be fixed.
- Keep changes focused and reviewable.

### 2.5 Verify the Changes

After implementation:

1. Review the diff.
2. Run relevant automated checks available in the repository.
3. Inspect affected imports, types, public exports and the React/Vue integrations.
4. Verify acceptance criteria against the actual implementation.
5. Report completed checks, failures, and unverified behavior accurately.

Never claim that a test, lint command, type check, or build passed unless it was actually executed and passed.

## 3. Universal Code Writing Standards

### 3.1 Readability First

**Rule:** Prefer clear, explicit, idiomatic code over clever or unnecessarily compact solutions.

Code should be understandable without requiring the reader to mentally evaluate complex expressions or navigate excessive indirection.

BAD:

```ts
const severity = ratio < aa ? "error" : ratio < aaa ? "warning" : large ? "ok-large" : "ok";
```

GOOD:

```ts
if (ratio < aa) {
  return "error";
}

if (ratio < aaa) {
  return "warning";
}

return "ok";
```

Use the second approach when separate branches improve readability. Do not expand simple expressions unnecessarily.

### 3.2 Simplicity and Minimalism

- Implement only what the task requires.
- Avoid premature generalization and speculative extensibility.
- Do not introduce abstractions for hypothetical future use cases.
- Prefer established platform and library capabilities over custom implementations.
- Do not add configuration solely to accommodate an unrequested future possibility.

Simplicity does not mean omitting necessary error handling, accessibility, type safety, or validation.

### 3.3 Function Responsibilities

Functions, checks, and UI builders MUST have cohesive responsibilities.

Extract code when doing so materially improves at least one of the following:

- Readability.
- Reuse across meaningful call sites.
- Separation of responsibilities.
- Testability.
- Isolation of complex behavior.

Do not extract functions merely to reduce line count.

Avoid both monolithic functions and artificial fragmentation. There is no universal maximum number of lines for a function.

### 3.4 DRY Without Overengineering

Avoid duplicating meaningful business logic, validation rules, or complex behavior.

However, superficially similar code does not always justify a shared abstraction.

Before extracting shared logic, consider whether the call sites have the same responsibility and whether the abstraction will remain easier to understand than the original code.

Do not introduce generic frameworks for one isolated use case without a concrete justification.

### 3.5 Naming

- Use descriptive names that communicate intent and domain meaning.
- Follow the naming conventions already established in the repository.
- Prefer consistent terminology across checks, options, messages and types (for example *check*, *issue*, *highlight*).
- Avoid unexplained abbreviations, vague names, and boolean variables whose meaning is unclear.
- Use names that describe behavior rather than implementation details when appropriate.

BAD:

```ts
const l = links.filter((x) => x.t);
```

GOOD:

```ts
const externalLinks = links.filter((link) => link.target === "_blank");
```

### 3.6 Control Flow

- Prefer early returns when they make conditions easier to understand.
- Avoid deeply nested conditionals and nested ternaries.
- Extract complex conditions into well-named variables or functions when doing so improves clarity.
- Use `switch` statements, lookup objects, or dedicated functions when they express the domain more clearly than nested conditionals.

Do not create unnecessary helper functions for trivial expressions.

### 3.7 Constants and Magic Values

Use named constants for meaningful domain values, repeated values, or configuration that benefits from a central definition.

Do not turn every literal into a constant.

Keep configuration values close to their responsibility unless they genuinely need to be shared.

### 3.8 Comments

Comments MUST explain intent, constraints, or non-obvious decisions rather than repeat what the code already says.

GOOD:

```ts
// Headers inside sectioning content are not page landmarks (HTML-AAM).
```

Avoid comments that merely narrate an operation:

```ts
// Set the outline to red.
el.style.outline = "2px solid red";
```

Additional rules:

- Keep comments synchronized with implementation.
- Remove obsolete comments and commented-out code.
- Avoid vague TODOs without actionable context.
- Use TODOs only when a real follow-up remains necessary.
- Explain temporary workarounds and their removal conditions.

### 3.9 Dead Code and Side Effects

- Do not introduce unused variables, imports, functions, components, or dependencies.
- Do not leave temporary debugging statements in production code.
- Keep side effects explicit and predictable.
- Follow the immutability requirements of the relevant framework and libraries.
- Do not mutate the host page beyond what §6.3 allows.

### 3.10 Defensive Coding

Handle realistic edge cases, including missing data, invalid inputs, asynchronous failures, and unavailable dependencies when relevant to the feature.

Do not add defensive branches for impossible scenarios without a reasonable justification.

Never use silent fallbacks to conceal unexpected failures. If a fallback is appropriate, its behavior should be intentional and understandable.

## 4. TypeScript and Type Safety

**Conditional:** Applies wherever TypeScript is used.

### 4.1 Preserve Type Safety

Resolve the underlying cause of type errors instead of bypassing the type system merely to make code compile.

- Prefer accurate types over `any`.
- Use `unknown` for values of genuinely unknown types and narrow them before use.
- Prefer inference when it produces clear and correct types.
- Add explicit annotations at important boundaries and where inference is insufficient.
- Avoid redundant or misleading type annotations.
- Reuse existing domain types when appropriate.

BAD:

```ts
const options = input as any;
return options.rules.imageAlt;
```

GOOD:

```ts
function isImageAltEnabled(options: Partial<SATOptions>): boolean {
  return options.enableCheckImageAlt ?? satOptions.enableCheckImageAlt;
}
```

Options come from the integrator's code and are typed by `SATOptions`; do not accept `any` at the public boundary.

### 4.2 Type Assertions

Do not use `as`, non-null assertions (`!`), or similar mechanisms to suppress errors without justification.

Assertions are acceptable when a real invariant is established and TypeScript cannot adequately represent it.

Keep assertions narrowly scoped and document non-obvious assumptions.

Never use an assertion as a substitute for runtime validation of untrusted external data.

### 4.3 Strict Configuration

Preserve the repository's TypeScript strictness settings.

- Do not disable strict checks to accommodate implementation errors.
- Do not introduce broad compiler suppressions.
- Avoid `@ts-ignore`.
- Use `@ts-expect-error` only when an intentional, understood type error is necessary and the reason is documented.
- Avoid `@ts-nocheck` and equivalent file-wide escape hatches.

Any change to compiler settings must have a concrete, repository-level justification and must not weaken type safety merely to pass the build.

### 4.4 Runtime Data

TypeScript types do not validate runtime data. Values read from the page (attributes, computed styles, `localStorage`, network responses) are untrusted: parse them defensively and handle the unparseable case explicitly (see `parseColor`, `readStored`).

### 4.5 Avoid Duplicate Types

Keep check-specific types next to the check. Shared types (`SATOptions`, results) live in `src/sat/` and are re-exported by the public entry points; do not redeclare them in integrations.

## 5. Repository Architecture

```
src/
  core/
    seoAccessibilityTool.ts   runs the enabled rules, returns the issues (entry: ".")
    rules/
      index.ts                the registry: every rule, in result order
      rule.ts                 Rule, RuleContext, RuleId
      a11y/, seo/             one file per rule, named after its id
      headings.ts             helpers shared by the heading rules
  sat/
    satChecker.ts             in-page controller: button, run/stop, storage (entry: "./sat-controller")
    satDom.ts                 DOM helpers shared by every rule (queryTargets, describeElement)
    issue.ts                  Issue, Severity, Category, cssSelector
    satOptions.ts             SATOptions, rule settings, 1.x options mapped to rules
    satReset.ts               deprecated no-op (SAT no longer changes the page)
  ui/                         panel in a shadow root (satUI.ts), boxes over the page (overlay.ts), styles (DOM built by hand, no framework)
  integrations/               react.ts, vue.ts: thin wrappers around satChecker
  engines/                    axe.ts: other checkers as `Engine`s (entry: "./axe"), with their package as optional peer dependency
  types/                      global declarations
tests/                        Vitest (jsdom) unit tests, setup
tests/browser/                Playwright tests on the built bundle in Chromium
plan/                         backlog and phases (plan/README.md)
```

### 5.1 Boundaries

- `core/` never imports from `ui/` or `integrations/`: it must run without the panel (tests, CI, future headless API).
- Rules import only from `sat/satDom.ts`, `core/rules/` and type modules. They keep no module-level state: results go through `ctx.report`, so runs never mix.
- Integrations stay thin: lifecycle wiring and options passthrough, no logic of their own. Logic shared by React and Vue lives in `sat/`.
- Engines translate another checker's results into `Issue`s and list the SAT rules they replace; `core/` knows only the `Engine` interface, never the checker's package.
- The public API is what the five entry points in `package.json` `exports` expose. Anything else is internal and may change.

## 6. Writing Checks

### 6.1 Accuracy First

A false positive costs more than a missed issue: developers stop trusting the tool. Every check MUST follow the relevant specification (WCAG 2.x, WAI-ARIA 1.2, HTML-AAM, HTML) and the doc comment of the check states the rule it enforces.

- Prefer reporting nothing over reporting a valid pattern (for example `tabindex="-1"` on a modal, an `<h2>` after an `<h3>`).
- Do not recommend explicit roles that duplicate native semantics (first rule of ARIA).
- When a check cannot decide (background image, unparseable color), skip the element; do not guess.

### 6.2 Severity

- **Error**: a violation of a WCAG success criterion, of the ARIA/HTML specification, or a missing SEO essential (`<title>`, meta description, `lang`).
- **Warning**: a best practice or a likely problem that needs human judgement (AAA contrast, redundant role, long title).

Changing the severity or the default state of a check is a behavior change (§8.2).

### 6.3 The Host Page

SAT runs inside someone else's application.

- Select elements with `queryTargets(selector, ctx.document)` so SAT's own UI (`[data-sat-ignore]`) is excluded and the checked document is the one of the run.
- Never change the page: no styles, attributes or nodes on host elements. Rules only report; the panel draws the boxes on its own layer (`ui/overlay.ts`). Moving focus to an element the user clicked in the panel is the only exception.
- Checks are read-only otherwise: no network requests, no navigation, no storage writes. The broken-links check is the only one that makes requests; it is off by default and skips state-changing URLs.
- Do not print to the console from rules; results go through `ctx.report`.

### 6.4 Messages

- Messages are in English, start with the problem, include the element (`describeElement`) and, when useful, the fix.
- Keep one message per problem per element; do not report the same problem from two checks.

### 6.5 Adding a Check

1. One file `core/rules/<category>/<id>.ts` exporting a `Rule`: `id` (kebab-case, added to `RuleId`), `category`, `defaultSeverity`, `wcag` when a criterion applies, `defaultOff: true` if it must be turned on explicitly, and `run(ctx)`.
2. `run` selects elements from `ctx.document` and calls `ctx.report({ message, element })` once per problem; `severity` and `wcag` only when they differ from the rule's defaults.
3. The rule added to the array in `core/rules/index.ts`; the runner already wraps each rule in an error guard and applies the `rules` option.
4. A row in the README rules table.
5. Unit tests with passing and failing markup; browser tests if the rule depends on layout, computed colors or visibility.
6. An entry in `CHANGELOG.md`.

New rules get no `enableCheck*` option: those exist only for 1.x compatibility.

## 7. SAT User Interface

- Every SAT element is inside the `<sat-panel data-sat-ignore>` host, in its open shadow root; styles live in `ui/styles.ts`, and `:host { all: initial }` stops inherited page styles.
- SAT's UI must pass SAT's own checks: buttons have accessible names, controls work with the keyboard, Escape closes the panel and returns focus (tested in `tests/browser/panel.spec.ts`).
- The UI never depends on the host's CSS and must not leak styles into the host.
- UI strings and messages are in English only (no localization).

## 8. Public API, Compatibility and Releases

### 8.1 Semantic Versioning

- Patch: fixes that do not change which issues are reported on a correct page.
- Minor: new checks, new options, behavior changes documented in `CHANGELOG.md` with the old behavior still reachable or clearly better.
- Major: removal or renaming of exports or options, changed result shape, changed activation rules.

### 8.2 Behavior Changes

Any change to defaults, severities or what a check reports is listed under **Behavior changes** in `CHANGELOG.md`.

### 8.3 Dependencies and Activation

- Runtime dependencies: none besides `tslib`. React, Vue and axe-core are **optional** peer dependencies, imported only by their entry point.
- SAT is a development tool: the controller starts only when `process.env.NODE_ENV === "development"`, unless the `enabled` option says otherwise.
- Publishing to npm is done by the maintainer, never by an agent.

## 9. Performance and Reliability
### 9.1 Evidence-Based Optimization

Avoid premature optimization.

Prioritize:

- Measured bottlenecks.
- Excessive network requests.
- Unnecessary repeated work.
- Large payloads or bundles.
- Repeated `getComputedStyle` or DOM walks for the same element on large pages.
- Concrete responsiveness or usability problems.

Do not add caching layers, virtualization, lazy loading, or complex memoization without a reason relevant to the task.

### 9.2 Asynchronous Operations

Handle realistic asynchronous states and failures.

Avoid race conditions, stale updates, and duplicate submissions where relevant.

Follow the cancellation, cleanup, and request lifecycle capabilities provided by the existing libraries.

Do not add elaborate retry or fallback policies without a concrete requirement.

### 9.3 Dependencies

Before adding a dependency:

1. Check whether existing libraries already provide the required capability.
2. Verify compatibility with the installed stack.
3. Consider maintenance, bundle impact, and security implications.
4. Explain why the dependency is necessary.

Runtime dependencies end up in every integrator's development bundle: add one only after a decision recorded in `plan/README.md`.

### 9.4 Security

- Never commit secrets or private credentials.
- Never render page content or messages with `innerHTML`; use `textContent`.
- Do not send page content anywhere: SAT works locally in the browser.
- Treat URLs, user-provided values, API responses, and browser storage as potentially untrusted where appropriate.

Security-sensitive changes require explicit reasoning and proportionate verification.


## 10. Testing and Quality Gates

### 10.1 Test Existing Behavior and Risk

Testing effort MUST be proportional to the risk and behavior changed.

Add or update tests when changes affect meaningful behavior, including:

- What a check reports and does not report (both the violation and the valid patterns around it).
- Option defaults and option handling.
- Changes to the host page and their restoration.
- Parsing of colors, attributes and stored data.
- The React and Vue integrations.

Do not add tests that merely reproduce implementation details or duplicate existing coverage without benefit.

### 10.2 Unit Tests

Vitest with jsdom (`tests/*.test.ts`). Build the markup with `document.body.innerHTML`, run the check, assert on the logged errors and warnings. jsdom has no layout and no canvas: anything that depends on them goes in the browser tests.

### 10.3 Browser Tests

Playwright on Chromium (`tests/browser/*.spec.ts`) runs the built bundle (`dist/index.js`) in a real page. Use it for contrast, colors, visibility and anything that needs layout.

### 10.4 Self Check

SAT's own UI must not produce issues when SAT analyzes a page (§7).

### 10.5 Existing Quality Tools

Inspect and use the scripts and configurations already available in the repository.

- `npm run verify`: type check, lint, unit tests, build. Must pass before every commit.
- `npm run verify:e2e`: build and browser tests. Must pass before merging a phase.

Do not duplicate rules already enforced by reliable automated tooling in this document. This document defines engineering intent and exception handling; automated tools enforce mechanical rules.

Do not disable lint rules, tests, strict checks, or build checks simply to make a task pass.

### 10.6 Reporting Results

Clearly distinguish:

- Checks that passed.
- Checks that failed.
- Checks that were not run.
- Checks that could not run because of environmental constraints.

If a check fails, investigate whether the failure is caused by the change or an existing issue.

Do not claim successful verification based on inspection alone.

## 11. Scope Discipline and Existing Defects

### 11.1 Smallest Coherent Solution

Implement the smallest coherent solution that fully satisfies the task requirements.

Avoid:

- Unrelated refactoring.
- Opportunistic cleanup.
- Speculative features.
- Broad renaming without need.
- New abstractions unrelated to the task.
- Changes to unrelated configuration.
- Rewriting working code merely to match personal preferences.

### 11.2 Directly Related Defects

Agents may fix pre-existing defects when they directly affect the requested functionality, correctness, security, maintainability, or meaningful verification.

When making such a fix:

- Explain why it is relevant.
- Keep the change focused.
- Avoid expanding the scope unnecessarily.
- Include appropriate verification when possible.

If a broader change would materially increase risk, complexity, or scope, explain the implications and seek clarification when necessary.

### 11.3 Preserve Existing Behavior

Do not change established behavior unless the task requires it or a directly related defect justifies the change.

Consider other consumers of shared components, hooks, services, and types before changing their contracts.


## 12. Repository-Specific Configuration

### 12.1 Build

- Rollup builds the five ESM entry points in one pass (`rollup.config.js`), with the shared code of `core/` and `sat/` in one chunk (`dist/chunks/seoAccessibilityTool.js`, `manualChunks`), and their declarations (`rollup.dts.config.cjs`). Keep `exports` in `package.json` and both configs in sync. Chunk names have no hash, so a new build overwrites the old files.
- Browser tests serve `dist/` from a fake origin (`tests/browser/serve.ts`) and import the entry points as an app does.
- TypeScript in strict mode, `moduleResolution: "bundler"`, Node types only for `process.env.NODE_ENV`.

### 12.2 Quality Tools

- ESLint flat config (`eslint.config.js`) with `@eslint/js` and `typescript-eslint` recommended rules.
- Vitest with jsdom; `tests/setup.ts` makes `getContext` return `null` like a browser without canvas.
- Playwright with Chromium only (`playwright.config.ts`).
- CI (`.github/workflows/ci.yml`) runs `verify` and `verify:e2e` on pull requests and on `develop`.

### 12.3 Plan and Agent Rules

- The backlog lives in `plan/` (format in `plan/README.md`). Each phase is worked on a `fase/f<n>-<slug>` branch, merged into `develop` with `--no-ff` and pushed.
- `AGENTS.md` (imported by `CLAUDE.md`) adds agent rules: explore with tokensave, apply the Ponytail ladder, run `npm run verify` before every commit. It does not replace this document.
- Deliberate simplifications are marked with a `ponytail:` comment that states the limit and when to go beyond it.

## 13. Instructions and Conflict Resolution

This document is the central source for engineering conventions in this repository. It does not override higher-priority instructions or explicit task requirements.

When instructions conflict:

1. Follow the applicable instruction hierarchy of the environment and tools.
2. Respect explicit task requirements when they do not conflict with higher-priority instructions.
3. Apply repository and directory-level guidance according to its actual scope and precedence.
4. Use this document for engineering conventions where no higher-priority or more specific applicable instruction determines the behavior.
5. Identify material conflicts rather than silently ignoring them.

Do not invent a universal precedence rule when the environment provides a different one.

When a conflict cannot be resolved safely, explain it and ask for clarification.

### Agent Instruction Files

When the repository uses `AGENTS.md`, `CLAUDE.md`, or equivalent agent instruction files:

- Ensure the applicable entry point directs agents to read `CONVENTIONS.md` before implementation.
- Keep instruction files concise and focused on agent-specific entry points, tooling, and repository navigation.
- Do not duplicate the full engineering standard across multiple files.
- Preserve any additional instructions required by the relevant agent environment.

A convention document alone does not guarantee that every agent will read it. Use supported instruction entry points and automated checks where practical.

## 14. Definition of Done

A task is complete only when all applicable requirements below have been addressed.

### Implementation

- [ ] The requested behavior is implemented.
- [ ] Relevant acceptance criteria are satisfied.
- [ ] The implementation follows applicable conventions and existing architectural patterns.
- [ ] Types, imports, and dependencies are coherent.
- [ ] No unnecessary abstractions, dependencies, or unrelated changes were introduced.

### Accuracy and Compatibility

- [ ] Checks follow the referenced specification; valid patterns are not reported (§6.1).
- [ ] The host page is never changed (§6.3).
- [ ] Public API, defaults and severities are unchanged, or the change is in `CHANGELOG.md` (§8).
- [ ] README options table and `CHANGELOG.md` are up to date.

### Verification

- [ ] Relevant tests have been added or updated when appropriate.
- [ ] Applicable automated checks have been executed when possible.
- [ ] The final diff has been inspected.
- [ ] Failures and unverified checks are clearly reported.

### Communication

- [ ] The final summary explains the important changes.
- [ ] Relevant architectural or implementation decisions are explained.
- [ ] Remaining assumptions, limitations, and open decisions are identified.
- [ ] No test, build, or verification result is claimed without evidence.

Not every checkbox requires a new artifact or test for every task. The agent must make a reasonable, risk-based determination and explain any material exception.

## 15. Exceptions

Exceptions are allowed when a rule conflicts with a concrete technical constraint, a valid product requirement, compatibility, or a more specific applicable instruction.

Every material exception MUST:

1. Identify the rule or intended behavior being deviated from.
2. Explain why the deviation is necessary.
3. Keep the deviation as narrow as practical.
4. Describe relevant risks or limitations.
5. Include verification where feasible.

Do not use convenience, personal preference, or a desire to silence a tool error as sufficient justification.

## 16. Final Agent Response

After completing a task, provide a concise, factual summary containing:

1. What changed.
2. Important implementation decisions.
3. Relevant tests and checks executed, including actual results.
4. Checks that failed or could not be executed.
5. Remaining limitations, assumptions, or open decisions.

Do not repeat the entire task description.

Do not claim that files were created, commands were run, tests passed, or integrations work unless that is supported by actual execution or inspection.

The objective is not maximum code volume. It is a correct, maintainable, proportionate implementation that satisfies the task while preserving the integrity of the existing library.
