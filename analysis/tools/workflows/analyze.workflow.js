export const meta = {
  name: 'analyze-b4v-repos',
  description: 'Deep architecture/production-readiness analysis of Build4Venezuela project repos',
  phases: [{ title: 'Analyze', detail: 'one agent per cloned repo, enriched schema' }],
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary','project_type','stack','architecture','code_organization','production_readiness','maturity','viability','key_features','domain_tags','merge_potential','red_flags'],
  properties: {
    summary: { type: 'string' },
    project_type: { type: 'string' },
    stack: {
      type: 'object', additionalProperties: false,
      required: ['frontend','backend','database','infra_deploy','ai_ml','languages'],
      properties: {
        frontend: { type: 'array', items: { type: 'string' } },
        backend: { type: 'array', items: { type: 'string' } },
        database: { type: 'array', items: { type: 'string' } },
        infra_deploy: { type: 'array', items: { type: 'string' } },
        ai_ml: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
      },
    },
    architecture: {
      type: 'object', additionalProperties: false,
      required: ['pattern','uses_orm','orm_or_db_layer','api_design','separation_of_concerns','modularity','notable_patterns'],
      properties: {
        pattern: { type: 'string' },
        uses_orm: { type: 'boolean' },
        orm_or_db_layer: { type: 'string' },
        api_design: { type: 'string' },
        separation_of_concerns: { type: 'string' },
        modularity: { type: 'string' },
        notable_patterns: { type: 'array', items: { type: 'string' } },
      },
    },
    code_organization: {
      type: 'object', additionalProperties: false,
      required: ['score','directory_structure','naming_quality','documentation_quality','reasoning'],
      properties: {
        score: { type: 'integer', minimum: 1, maximum: 5 },
        directory_structure: { type: 'string' },
        naming_quality: { type: 'string' },
        documentation_quality: { type: 'string' },
        reasoning: { type: 'string' },
      },
    },
    production_readiness: {
      type: 'object', additionalProperties: false,
      required: ['score','has_auth','has_error_handling','has_logging','has_env_config','has_deploy_config','secrets_handling','security_notes','scalability_notes','reasoning'],
      properties: {
        score: { type: 'integer', minimum: 1, maximum: 5 },
        has_auth: { type: 'boolean' },
        has_error_handling: { type: 'boolean' },
        has_logging: { type: 'boolean' },
        has_env_config: { type: 'boolean' },
        has_deploy_config: { type: 'boolean' },
        secrets_handling: { type: 'string' },
        security_notes: { type: 'string' },
        scalability_notes: { type: 'string' },
        reasoning: { type: 'string' },
      },
    },
    maturity: {
      type: 'object', additionalProperties: false,
      required: ['score','has_readme','has_tests','has_ci','is_real_or_boilerplate','reasoning'],
      properties: {
        score: { type: 'integer', minimum: 1, maximum: 5 },
        has_readme: { type: 'boolean' },
        has_tests: { type: 'boolean' },
        has_ci: { type: 'boolean' },
        is_real_or_boilerplate: { type: 'string' },
        reasoning: { type: 'string' },
      },
    },
    viability: {
      type: 'object', additionalProperties: false,
      required: ['score','reasoning'],
      properties: {
        score: { type: 'integer', minimum: 1, maximum: 5 },
        reasoning: { type: 'string' },
      },
    },
    key_features: { type: 'array', items: { type: 'string' } },
    domain_tags: { type: 'array', items: { type: 'string' } },
    merge_potential: { type: 'string' },
    red_flags: { type: 'array', items: { type: 'string' } },
  },
}

const VOCAB = 'people-finder, shelter-mapping, donations-aid, seismic-data, medical-health, mental-health, family-reunification, aid-logistics, comms-chat, structural-inspection, volunteer-coordination, mapping-geo, alerts-notifications'

phase('Analyze')

const items = Array.isArray(args) ? args : JSON.parse(args)

const results = await pipeline(
  items,
  (it) => agent(
    `You are doing a DEEP architecture + production-readiness review of ONE GitHub repo, for a hackathon (Build4Venezuela) whose winning projects will be deployed to help real earthquake victims in Venezuela. Viability and production-readiness matter a LOT. Be rigorous, skeptical, and evidence-based — base every score on what the CODE actually contains, not README claims. If something is AI-generated boilerplate / empty scaffolding with no real logic, say so plainly and score low.

Repo is cloned at: ${it.c}
Pre-collected raw signals JSON (READ FIRST): ${it.g}

Inspect the ACTUAL code: package.json/lockfiles/requirements/go.mod, Dockerfile/CI, config, directory layout, main source/server files, the DB access layer (detect ORM vs raw SQL vs BaaS client), auth, error handling, env/secret management, tests.

Scoring rubric (1=skeleton/empty, 2=early prototype, 3=working MVP, 4=polished/usable, 5=production-grade).

For domain_tags use ONLY this controlled vocabulary (add a new tag only if none fit): ${VOCAB}

Return the structured object. Fill EVERY field. Keep reasoning fields to 1-3 sentences.`,
    { label: `analyze:${it.s}`, phase: 'Analyze', schema: SCHEMA, agentType: 'Explore', model: 'sonnet', effort: 'medium' }
  ).then((a) => (a ? { project_slug: it.s, clone_path: it.c, analysis: a } : { project_slug: it.s, clone_path: it.c, analysis: null }))
)

const ok = results.filter((r) => r && r.analysis)
log(`Analyzed ${ok.length}/${items.length} repos`)

return results
