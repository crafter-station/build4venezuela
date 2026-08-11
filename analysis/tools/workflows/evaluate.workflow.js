export const meta = {
  name: 'evaluate-b4v-projects',
  description: 'Evaluate real-problem fit, product quality, and diffusion/promo readiness of B4V projects',
  phases: [{ title: 'Evaluate', detail: 'per project: read insight + check live demo + judge' }],
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['solves_real_problem','real_problem_reasoning','problem_severity','impact_potential','product_quality','live_demo_status','live_demo_notes','diffusion','overall_recommendation','one_line_pitch'],
  properties: {
    solves_real_problem: { type: 'string', enum: ['yes','partial','no','unclear'] },
    real_problem_reasoning: { type: 'string' },
    problem_severity: { type: 'string', enum: ['critical','high','medium','low'] },
    impact_potential: { type: 'integer', minimum: 1, maximum: 5 },
    product_quality: { type: 'integer', minimum: 1, maximum: 5 },
    live_demo_status: { type: 'string', enum: ['working','partial','broken','no-public-demo','unknown'] },
    live_demo_notes: { type: 'string' },
    diffusion: {
      type: 'object', additionalProperties: false,
      required: ['score','ready_to_promote','available_assets','recommended_angle','gaps'],
      properties: {
        score: { type: 'integer', minimum: 1, maximum: 5 },
        ready_to_promote: { type: 'boolean' },
        available_assets: { type: 'array', items: { type: 'string' } },
        recommended_angle: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
      },
    },
    overall_recommendation: { type: 'string', enum: ['spotlight','promote','improve-first','merge-candidate','deprioritize'] },
    one_line_pitch: { type: 'string' },
  },
}

phase('Evaluate')
const items = Array.isArray(args) ? args : JSON.parse(args)

const results = await pipeline(
  items,
  (it) => agent(
    `You are evaluating ONE Build4Venezuela hackathon project for: (1) does it solve a REAL problem for earthquake victims in Venezuela, (2) how good/complete the actual product is, and (3) whether it is ready to create PROMOTIONAL / diffusion content (social posts, spotlight) right now.

STEP 1 — Read the full insight JSON (technical analysis + metadata) at:
${it.p}
It contains: analysis (stack, architecture, maturity, production_readiness, viability, key_features, domain_tags, red_flags), db_description (the team's own pitch), live_url, video_url, signals (stars/commits/loc).

STEP 2 — Check the live demo. Live URL: ${it.u || '(none)'}
${it.u && /^https?:\/\//.test(it.u) && !/github\.com/.test(it.u) ? 'Use WebFetch on the live URL to see if it actually loads and what it presents (is it a real working product, a landing page, or broken?). If WebFetch fails or times out, set live_demo_status to "unknown" and note it.' : 'No public web demo (repo-only or chat/whatsapp link) — set live_demo_status to "no-public-demo".'}
Demo video present: ${it.v ? 'yes (' + it.v + ')' : 'no'}.

STEP 3 — Judge. Be honest and victim-impact-focused. A polished landing page with no working product is NOT high product_quality. Boilerplate scores low. "Ready to promote" means there is something real and presentable a victim or donor could use TODAY.

Scoring: impact_potential & product_quality & diffusion.score on 1-5 (5 best).
available_assets: pick from [live-demo, demo-video, screenshots, clear-value-prop, branding, real-users] — only those that genuinely exist.
overall_recommendation: spotlight (best, promote heavily) | promote | improve-first | merge-candidate | deprioritize.
one_line_pitch: a crisp, marketing-ready Spanish-or-English one-liner usable in a social post.

Return the structured object, filling EVERY field.`,
    { label: `eval:${it.s}`, phase: 'Evaluate', schema: SCHEMA, agentType: 'Explore', model: 'sonnet', effort: 'medium' }
  ).then((e) => ({ project_slug: it.s, evaluation: e }))
)

const ok = results.filter((r) => r && r.evaluation)
log(`Evaluated ${ok.length}/${items.length} projects`)
return results
