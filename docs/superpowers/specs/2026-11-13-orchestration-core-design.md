# MRX orchestration core website

## Intent and authorization
Varun chose the recommended orchestration-core direction and delegated the remaining design decisions, implementation, testing and GitHub Pages publication. Build an Argus-inspired cinematic explanation of the Multi-Role Model Orchestration CLI.

## Experience
Use MRX's existing cyan reasoner, green executor and amber tool-caller identity, self-hosted Space Grotesk and JetBrains Mono. Dark spacious editorial layout, large headings and a persistent Three.js stage. Three distinct sculptural cores connected by signal paths reveal different roles as visitors scroll. Pointer movement adds subtle parallax; selectable roles show their responsibilities. Native scrolling stays intact.

A keyboard-accessible simulation provides think_then_answer, planner_executor and manual modes, run/replay and mode-specific step logs. It makes no model requests, asks for no credentials, and labels every output illustrative. Mode descriptions follow the actual source: conclusion handoff, dependency-based execution waves, explicit manual routing; tools execute in planner_executor; manual mode only selects a model and think_then_answer does not use tools. Avoid invented speed, cost or privacy guarantees.

Sections: hero, roles, mode playground, providers, configuration, installation and final call to action. Generate on-site guide pages from the existing Markdown for configuration, modes, providers, tools and contributing, with navigation back to the site. Code can be copied with feedback and a selectable-text fallback.

## Constraints
Static GitHub Pages at /mrx/; all internal assets and links respect the repository prefix. No production API or backend. Three.js is pinned and served from the site, without external CDN dependencies. Core copy and links remain available with JavaScript disabled, WebGL unavailable, or reduced motion enabled. Reduced motion disables continuous animation; a visible motion control allows pausing. Hidden tabs stop rendering. Mobile gets a bounded stage and stacked content with no horizontal overflow. Scope excludes MRX CLI behavior and npm release changes.

## Approaches
Chosen: orchestration core, because it explains MRX's defining role separation. A provider constellation would foreground vendors; a terminal command center would reduce the sculptural impact. Both were offered and not selected.

## Implementation calls
Use semantic HTML, CSS and ES modules; a small isolated website build package provides pinned Three.js and Markdown generation. Preserve the existing design-system showcase. Use an isolated feature branch, review the complete change, and publish after successful checks. If repository administration blocks Pages enablement, report the exact remaining setting instead of claiming publication.

## Validation
Browser checks cover all modes, replay, role controls, guide navigation, copy feedback, keyboard navigation, mobile width, reduced motion, no-JS and unavailable WebGL. Inspect desktop/mobile screenshots. Build and validate every generated relative link, run existing CLI tests/build/lint and inspect the deployed page before claiming it is live.
