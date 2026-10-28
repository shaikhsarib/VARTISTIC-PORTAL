// Content module B - sections 6-9 + appendices

const B = [];

// ---------------------------------------------------------------- 6. Craft layer
B.push(["h1", "6. Craft Layer: UX Methodology Resources"]);
B.push(["h2", "6.1 Built for Mars: Teardowns as a Subscription Business"]);
B.push(["p", "Built for Mars (Peter Ramsey, UK) is the business benchmark for UX-craft content. Its measured inventory comprises 95 interactive case studies (five-to-eight-minute step-by-step teardowns of Monzo, Zoom, Klarna, Hinge, Granola and others, each ending in named takeaways), 1,496 individually numbered UX Bites (one screenshot plus a one-or-two-sentence insight, with the latest numbered #1496, an ever-growing feed that creates collect-them-all pull), 13 cheatsheets that package bites under principles such as onboarding rules, social proof and anxiety, a glossary of 53 cognitive biases and UX laws (hyperbolic discounting, peak-end rule, decoy effect, Doherty threshold), 20 example galleries, 8 quizzes, 526 company pages and 3 themed series. Every artifact cross-links to the psychology glossary, which is what turns screenshots into lessons."]);
B.push(["p", "The funnel is equally deliberate: a free newsletter of five UX Bites every Monday, newest case studies free as acquisition, the archive paywalled at GBP 12 per month (billed quarterly) or GBP 8 per month (billed annually), with team plans at GBP 100/50 per month, approximately 38,000 subscribers, and testimonial social proof from Nir Eyal, Steve Krug and DHH. The BFM+ tier adds a five-week bootcamp, AI-generated Pathways, quizzes, competitive alerts, an AI Insights feature that critiques uploaded screenshots using the library as grounding (every suggestion links to specific BFM content, an important anti-hallucination design), an MCP server, and a Figma plugin. The positioning line, if features are coded in minutes, design is the new moat, is the clearest articulation of why this entire research collection matters in 2026."]);
B.push(["h2", "6.2 checklist.design: Checklists as a Distribution Multiplier"]);
B.push(["p", "checklist.design (George Hatzis, Melbourne) provides 129 design checklists containing 773 items and 66 illustrated flow steps, organized in five categories: Website (27 checklists), Web app (32), Design system (32), Mobile app (25) and Flows (13, modeled as step sequences such as canceling a subscription in 4 steps or uploading media in 7). Depth is tiered: every item states what to include, 44% add a why-it-matters pro tip (for example, surfacing the next billing date and amount proactively reduces cancellations driven by surprise charges), and 48 checklists carry extra documentation or inspiration tabs. Per-checklist progress tracking is stored in localStorage, turning reference content into a tool, and a request-a-checklist modal feeds a demand-driven backlog."]);
B.push(["p", "Its strategic lesson is author-once, distribute-everywhere: the same 129 lists power a free website (Vite, React 19, Supabase, with copy-event and outbound-click analytics), a Figma plugin offering AI-powered design reviews, and a free agent skill (github.com/Checklist-Design/skills) that reviews what renders, not your markup, by inspecting a URL, a screenshot or a locally running page. The visual system is the craft aesthetic again: cream F4F3EE background, ink 26211C text, purple 684D95 primary, one pastel panel color per category, TT Hoves and JetBrains Mono type. It is entirely free, using checklists as reach rather than revenue."]);
B.push(["h2", "6.3 microcopy.me: The Minimal Viable Content Product"]);
B.push(["p", "microcopy.me is the study's minimal case: a free, single-page library of approximately 490 curated microcopy examples (measured from its actual CSV data files: 115 account-flow lines, 81 error messages, 62 plus 102 headlines, 128 slogans including famous brand lines such as Nike's Just Do It), with filter tabs for All, Account, Error, Headline and Slogan, a search box, a daily-copy rotation slot, and copy-to-clipboard with a Copied confirmation as the core delight interaction. The entire backend is four CSV files on a public Vercel blob store; the site was built with v0.dev (visible in its generator meta tag) on Next.js with Tailwind, and carries small SEO hygiene issues (canonical and sitemap still pointing at a vercel.app domain)."]);
B.push(["p", "Its value to this research is as a floor definition: a content product can ship as flat files plus a search box plus one delightful interaction, with zero backend. Its gaps are equally instructive: there are no why-it-works annotations, no product context screenshots, no CTA category despite the metadata promising one, and no monetization at all. Adding exactly those three missing pieces is how one would leapfrog it, which Built for Mars has effectively done in the same niche."]);
B.push(["h2", "6.4 Framer University: Ten Scroll-Animation Recipes"]);
B.push(["p", "The supplied Framer University article catalogs ten scroll animations with full mechanics and remix links: Fey-style scroll transforms (elements translate, scale or rotate as scroll progresses), text reveal using sticky positioning plus scroll-triggered variants, zoom scroll effects, scroll media scrubbing, sticky section pinning, a scroll-driven ticker, scroll rotation, a spiral 3D effect, horizontal scrolling galleries and a three-layer mountain parallax. Under the hood these reduce to a small set of primitives (scroll transforms, trigger frames, scroll variants, sticky positioning and layered parallax), which makes them directly portable to code-based stacks using GSAP ScrollTrigger or motion's useScroll."]);
B.push(["p", "For a component library, this list is effectively a content roadmap: each recipe is a component waiting to be built (ZoomScroll, MediaScrub, Ticker, SpiralReveal, HorizontalGallery, ParallaxLayers), and each ships with an audience already searching for it. Combined with react-bits' motion inventory and ThreeUI's runtime metadata, it defines a concrete motion design system for the product recommended in Section 8."]);

// ---------------------------------------------------------------- 7. Patterns
B.push(["h1", "7. Cross-Cutting Patterns and Industry Trends"]);
B.push(["h2", "7.1 Distribution Has Moved to the shadcn Registry Model"]);
B.push(["p", "The dominant component distribution mechanism in this set is no longer npm packages but the shadcn-style registry: a JSON manifest at a predictable URL plus a CLI command that copies source into the consumer's project. react-bits (872 items), Watermelon (registry.watermelon.sh), soundcn (soundcn.xyz/r/{name}.json), OpenSourceUI (copy-paste with identical conventions: forwardRef, cn(), data-slot) and ThreeUI (plus its own CLI) all follow it, and copy-paste ownership is the explicit philosophy: developers prefer owning readable source to depending on black-box packages. The registries are also machine-readable by construction, which is precisely what makes these libraries consumable by AI agents without extra work. Figure 2 compares the machine-readable catalog sizes that were directly measurable."]);
B.push(["figure", { path: "/home/z/my-project/research/figs/fig1_catalog_sizes.png", caption: "Figure 2. Machine-readable catalog size by component library (items exposed through registry, catalog or API)", width: 480 }]);
B.push(["h2", "7.2 Agent Surfaces Are the New SEO"]);
B.push(["p", "Ten of the twenty sources ship at least one machine surface beyond the website, and the leaders ship several. MCP servers are live or documented at Watermelon (hosted, keyless), ThreeUI (four catalog tools), refero (eight research tools), screens.design, and Built for Mars (BFM+ library access). Installable agent skills exist at Hallmark, refero, checklist.design and react-bits (twenty Pro skills), and string-tune's Skill Hub plus soundcn's bundled skill file show the pattern spreading to small projects. Watermelon publishes llms.txt and an OpenAPI spec; refero's docs do the same. Even the galleries' advertisers are now agent-tooling products. The direction is unmistakable: in 2026 a design product's reach is determined less by its Google ranking than by whether a coding agent can discover, query and apply it inside an editor. Table 3 maps the capability matrix."]);
B.push(["table", {
  caption: "Table 3. Agent and distribution surfaces by source",
  headers: ["Source", "Registry / CLI", "MCP server", "Agent skill", "Figma plugin", "Monetization"],
  widths: [17, 17, 15, 15, 13, 23],
  rows: [
    ["react-bits", "Yes (shadcn / jsrepo)", "Listed", "Yes (20, Pro)", "—", "MIT + Commons Clause; Pro tier"],
    ["Watermelon UI", "Yes (registry.watermelon.sh)", "Yes (hosted, keyless)", "—", "—", "Free, MIT"],
    ["soundcn", "Yes (shadcn format)", "—", "Skill file in repo", "—", "Free, MIT"],
    ["OpenSourceUI.in", "Copy-paste (shadcn conventions)", "—", "—", "—", "Free, MIT"],
    ["ThreeUI", "Yes (threeui-cli)", "Yes (4 tools)", "—", "—", "Pro USD 199/yr or 299 lifetime"],
    ["3dicons.co", "—", "—", "—", "—", "USD 99 lifetime Pro editor"],
    ["openui", "npm packages (16)", "—", "—", "—", "Free, MIT"],
    ["String Tune", "npm + attribute runtime", "—", "Skill Hub (tutorials)", "—", "Free, MIT"],
    ["Hallmark", "npx skills add", "—", "Yes (the product itself)", "—", "Free, MIT"],
    ["refero.design", "—", "Yes (8 tools)", "Yes", "Yes", "Pro USD 96/yr; teams; lifetime"],
    ["screens.design", "—", "Yes", "—", "—", "Pro subscription"],
    ["Built for Mars", "—", "Yes (BFM+)", "—", "Yes", "GBP 8-12/mo; teams GBP 50-100/mo"],
    ["checklist.design", "—", "—", "Yes (free)", "Yes (AI reviews)", "Free (reach)"],
  ],
}]);
B.push(["h2", "7.3 Four Working Monetization Models"]);
B.push(["p", "The set contains four monetization models, each proven with real numbers. Sponsorship suits single-element galleries at 500 to 800 items: footer.design, navbar.gallery, cta.gallery and supahero.io all sell 30-day slots between USD 79 and 279, justified by published traffic (65,000+ monthly views at navbar.gallery, domain authority 45). Subscription suits structured, deep corpora: refero (USD 96 per year with team seats) and Built for Mars (GBP 8 to 12 per month with approximately 38,000 subscribers) both gate archives while keeping acquisition content free. Lifetime Pro suits asset-heavy tools: ThreeUI at USD 299 and 3dicons at USD 99, processed through Stripe or Lemon Squeezy. Open-source with a paid tier suits community libraries: react-bits uses MIT plus Commons Clause to keep the 218 free components un-resellable while selling a Pro tier, and Hallmark and checklist.design show the zero-revenue variant, where free content is the marketing engine for other work. The common denominator across every paid model is structured content: raw screenshots are commoditized, but taxonomies, metadata and annotations are what people and agents pay for."]);
B.push(["table", {
  caption: "Table 4. Monetization models observed across the collection",
  headers: ["Model", "Examples", "Price points", "Preconditions"],
  widths: [16, 30, 26, 28],
  rows: [
    ["Sponsorship", "footer.design, navbar.gallery, cta.gallery, supahero.io", "USD 79-279 per 30 days", "500-800 curated items; publishable traffic and DA metrics"],
    ["Subscription", "refero.design, Built for Mars, screens.design", "USD 96/yr; GBP 8-12/mo; Pro plans", "Structured metadata, search depth, continuously refreshed archive"],
    ["Lifetime Pro", "ThreeUI, 3dicons.co", "USD 299; USD 99", "Asset-heavy catalogs with clear free/pro render or format split"],
    ["Open-source + Pro tier", "react-bits", "Pro tier (components, templates, skills)", "Large free core; Commons Clause-style license protecting Pro"],
    ["Free as reach", "Hallmark, checklist.design, microcopy.me, Watermelon", "USD 0", "Skill/plugin distribution; reputation or funnel value elsewhere"],
  ],
}]);
B.push(["h2", "7.4 An Aesthetic Consensus and a Motion Vocabulary"]);
B.push(["p", "A striking proportion of the collection independently converges on the same visual language: cream or paper backgrounds (OpenSourceUI's Craft Bench, Built for Mars at F5F3ED, checklist.design at F4F3EE, Hallmark at FAFAF9), near-black ink text, exactly one accent color, editorial serif display faces (Fraunces, Newsreader) beside clean UI sans (Geist, TT Hoves), real product screenshots over renders, and personality-rich microcopy. This craft-minimal wave is a direct counter-positioning against the generic dark-gradient SaaS look that AI page generators mass-produce, and the same instinct powers sloplint's list of AI tells. Any new product in this space should pick a side deliberately; the sources suggest the craft side is where differentiated taste is currently rewarded."]);
B.push(["p", "On the engineering side, the component layer shows a clear technical consensus: React 19 with Next.js 16 or Vite, Tailwind v4, the motion library (v13) with GSAP where timelines demand it, raw WebGL2/GLSL inlined per component instead of heavy abstraction libraries, Base UI and Radix as accessible primitives, Web Audio for sound, and pure-CSS effects (ArcBands, glass3d) wherever canvas is unnecessary. The scroll-animation recipes from Framer University complete a practical motion vocabulary. This stack profile is effectively the 2026 default for building the kind of product this research anticipates."]);

// ---------------------------------------------------------------- 8. Synthesis
B.push(["h1", "8. Synthesis: What This Collection Points Toward"]);
B.push(["h2", "8.1 Reading the Signals"]);
B.push(["p", "The twenty sources were not chosen at random, and their composition is the signal. The list includes four registries or libraries of animated components, two generative-UI reference stacks, an attribute-driven effects runtime with a skill catalog, an anti-slop design skill, four element-specific galleries, one structured design-research corpus, and four UX-craft resources, including a checklist system that is already distributed as an agent skill. Every one of them either supplies the pieces of, or demonstrates the business model for, the same product shape: a design engineering hub where developers and AI agents fetch components, patterns, motion recipes, sounds and craft checklists from one curated, machine-readable source. The presence of Hallmark and String Tune's Skill Hub in particular suggests the ambition includes agent-facing packaging, not just a human-facing website."]);
B.push(["p", "Stated as a product thesis: build the place a coding agent (or a developer with an agent) goes when it needs the interface to feel designed, an open-source animated component registry with taste encoded into it, backed by curated pattern galleries and craft checklists, distributed through a website, a shadcn-compatible registry, an MCP server and installable skills."]);
B.push(["h2", "8.2 Three Product Archetypes"]);
B.push(["p", "Archetype A is the open-source animated component registry, the react-bits and Watermelon pattern: 100 to 250 components across backgrounds, text effects, 3D, sound and scroll animations; four code variants; registry JSON; CLI install; MCP endpoint; MIT-plus-Commons-Clause licensing with a later Pro tier. Its strengths are depth, community and agent reach; its cost is a heavy engineering and content treadmill, and react-bits already owns the general-purpose niche."]);
B.push(["p", "Archetype B is the element gallery network, the footer.design pattern: one specific element anatomy (heroes, pricing sections, empty states, mobile onboarding), 500 curated items, a two-axis taxonomy with SEO landing pages, submissions with first-submitter credit, sponsor revenue. Its strengths are low maintenance and proven economics; its ceiling is a business capped by traffic, and the generic slots are increasingly taken (footers, navbars, CTAs, heroes are all occupied; gaps exist in pricing pages, empty states, dashboards and onboarding flows)."]);
B.push(["p", "Archetype C, and the recommendation, is the unified hub: a component registry as the engine, one or two galleries as the inspiration layer, craft checklists as the taste layer, and agent surfaces as the distribution layer, differentiated by the exact combination the research collection implies, components plus galleries plus checklists plus skills in one coherent product with one design voice. The differentiating wedge, following screens.design and refero, is to attach context to every artifact: which component, which pattern, why it works (the Built for Mars insight model), and which checklist items it satisfies."]);
B.push(["h2", "8.3 Recommended Blueprint"]);
B.push(["p", "The recommended stack follows the consensus found in Section 7.4: Next.js 16 with React 19 and Tailwind v4, motion plus GSAP where needed, raw WebGL2 inlined for shader components, shadcn conventions (forwardRef, cn, data-slot) throughout, a registry served at /r/{name}.json, an llms.txt, and content authored once and published to four surfaces (site, registry, MCP, skill). Licensing should follow the CC0-only precedent for assets (avoiding soundcn's unlicensed Warcraft sounds) and MIT plus Commons Clause for code, with react-bits used as architectural reference rather than copied source."]);
B.push(["bullets", [
  "Phase 1 (foundation): site skeleton, design system in the craft aesthetic, 20-30 seed components synthesized from the research (arc-band and grain backgrounds, glass tokens from the glass3d recipe, the ten Framer scroll recipes as code components, a Web Audio sound block set in the soundcn shape), registry JSON and llms.txt live on day one.",
  "Phase 2 (gallery + agents): one gallery with a two-axis taxonomy and desktop/mobile toggles on detail pages, curated submissions with first-submitter credit, an MCP server exposing search, get-source and get-prompt tools, and an agent skill that applies checklist-design-style review gates plus sloplint-inspired anti-slop checks.",
  "Phase 3 (monetization): sponsor slots once traffic is publishable, then a Pro tier (extended components, templates, additional skills) behind Stripe or Lemon Squeezy, with lifetime pricing considered for asset-heavy additions.",
]]);

// ---------------------------------------------------------------- 9. Conclusions
B.push(["h1", "9. Conclusions and Recommended Next Steps"]);
B.push(["p", "The research question was whether the twenty supplied sources describe a coherent product intention, and the answer is yes, with high confidence. They cover every layer of a design engineering hub, they agree on distribution (registries, MCP, skills, llms.txt), they agree on aesthetics (craft-minimal, cream and ink, one accent), they agree on content strategy (structured, annotated, machine-readable artifacts), and they contain four working monetization playbooks with real price points. The competitive map is also clear: general-purpose component registries have a leader (react-bits), the generic element galleries are occupied but narrow, and the open position is the integrated hub that treats components, patterns, checklists and skills as one structured corpus with context attached to every artifact."]);
B.push(["p", "The recommended immediate next steps are as follows. First, confirm the archetype: validate that the unified hub (Section 8.2, Archetype C) matches the intended ambition, or choose A or B if a narrower start is preferred; this is a product decision, not a technical one. Second, define the wedge element or component category to launch with, using the gap analysis above (pricing pages, empty states, onboarding flows and sound are under-served). Third, commission the Phase 1 build from the blueprint in Section 8.3, with the seed component list derived directly from this report's findings. Fourth, set up the content pipeline early, since every benchmark in this study succeeded on publishing cadence (numbered feeds, freshly-added rows, monthly flagship teardowns) rather than on launch-day volume. This report contains no fabricated projections; all figures cited are measured from the sources themselves as of late October 2026."]);

// ---------------------------------------------------------------- Appendix
B.push(["h1", "Appendix A. Component Technology and Content Model Detail"]);
B.push(["p", "The two tables below preserve detail that supports the analysis but is too granular for the body. Table A1 shows how the 218 react-bits components were classified during source analysis, by scanning imports and rendering code across the full repository tarball; the distribution explains why react-bits is simultaneously the heaviest (WebGL) and the most adaptable (CSS and DOM) library in the set. Table A2 records the content model of checklist.design from its public API, since it is the cleanest example in the study of tiered item depth (include, why, pro tip) and of flows as a distinct content genre."]);
B.push(["table", {
  caption: "Table A1. react-bits component rendering technology distribution (n = 218, classified by source scan)",
  headers: ["Rendering technology", "Components", "Share", "Typical examples"],
  widths: [30, 15, 12, 43],
  rows: [
    ["GLSL / raw WebGL2 (inlined)", "98", "45.0%", "Shader backgrounds, distortions, particle fields"],
    ["Canvas 2D", "47", "21.6%", "Ribbons, trails, ASCII effects, simulations"],
    ["Motion (framer / motion)", "28", "12.8%", "Text reveals, counters, magnetic elements"],
    ["GSAP timelines", "18", "8.3%", "Scroll-driven and sequenced animations"],
    ["Three.js", "6", "2.8%", "True 3D scenes and meshes"],
    ["CSS / DOM techniques", "21", "9.6%", "Gradients, blur, pure-CSS motion, layout effects"],
  ],
}]);
B.push(["table", {
  caption: "Table A2. checklist.design content model (measured from public API)",
  headers: ["Category", "Checklists", "Representative contents"],
  widths: [20, 14, 66],
  rows: [
    ["Website", "27", "Landing page, pricing, FAQ, 404, testimonials, waitlist, about, careers, blog, cart"],
    ["Web app", "32", "Dashboard, onboarding, settings, billing, notifications, empty state, data table"],
    ["Design system", "32", "Button, input, modal, tooltip, toggle, accordion, avatar, badge, card, tokens"],
    ["Mobile app", "25", "Onboarding, login, profile, chat, camera, map view, paywall, notifications"],
    ["Flows", "13 (66 steps)", "Add to cart, cancel subscription, delete account, reset password, upload media, verify account"],
  ],
}]);
B.push(["p", "Source-of-truth note: all counts in this appendix derive from direct measurement (repository source scan for Table A1; the site's public checklist API for Table A2) rather than from the products' own marketing pages, and were captured during the research window in October 2026."]);

module.exports = { B };
