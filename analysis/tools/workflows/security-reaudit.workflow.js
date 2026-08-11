export const meta = {
  name: 'security-reaudit-b4v',
  description: 'Re-audit Build4Venezuela repos: verify whether previously-reported security issues were fixed, and find new ones',
  phases: [{ title: 'Re-audit', detail: 'one agent per cloned repo: verify prior findings + fresh scan' }],
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['risk', 'findings', 'issueState', 'reauditNote'],
  properties: {
    // Overall CURRENT risk after re-verification (worst still-open finding).
    risk: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'title', 'status'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          title: { type: 'string' },
          // resolved = fixed in current code; partial = mitigated but not fully fixed;
          // open = still exploitable; new = newly discovered this pass.
          status: { type: 'string', enum: ['open', 'partial', 'resolved', 'new'] },
          evidence: { type: 'string' },
        },
      },
    },
    // Whether the tracking GitHub issue is still open. null if there was no issue / not checkable.
    issueState: { type: 'string', enum: ['open', 'closed', 'none'] },
    issueUrl: { type: ['string', 'null'] },
    reauditNote: { type: 'string' },
  },
}

phase('Re-audit')

const items = Array.isArray(args) ? args : JSON.parse(args)

const results = await pipeline(
  items,
  (it) => {
    const prevBlock = it.prev
      ? `This repo was AUDITED on ${it.prev.auditedAt} with overall risk "${it.prev.risk}". The previously reported findings were:
${it.prev.findings.map((f, i) => `  ${i + 1}. [${f.severity}] ${f.title}`).join('\n')}
${it.prev.issueUrl ? `A tracking issue was filed: ${it.prev.issueUrl}` : 'No tracking issue was filed.'}

Your PRIMARY job: for EACH previous finding, open the actual current code and determine whether it is now:
  - "resolved" (properly fixed),
  - "partial" (mitigated but still exploitable in some way — explain), or
  - "open" (unchanged / still fully exploitable).
Carry every previous finding forward in your \`findings\` array with its verdict in \`status\`. Do NOT drop a previous finding — if resolved, still list it with status "resolved".`
      : `This repo has NOT been audited before (it is new). Do a thorough first-time security audit.`

    return agent(
      `You are a rigorous application-security auditor reviewing ONE GitHub repo from the Build4Venezuela hackathon (projects that will be deployed to help real earthquake victims — leaked PII or takeover of aid data is high-stakes). Be skeptical and evidence-based: only report an issue you can point to in the actual code.

Repo cloned at: ${it.c}
GitHub repo (owner/name): ${it.repo}

${prevBlock}

ALSO do a fresh scan for NEW high-impact issues regardless of history. Focus on what matters for this class of app:
  - Hardcoded/committed secrets: service_role keys, API keys, DB URLs, JWT signing secrets, .env files in git.
  - Missing authentication/authorization on state-changing API routes (POST/PATCH/PUT/DELETE) — anyone can write/alter/delete data.
  - Mass-assignment (passing raw request body straight into DB update/insert with no field whitelist).
  - PII exposure: personal data (names, phone numbers, emails, locations of missing people) readable via public/anon access or leaked in API responses.
  - Supabase RLS disabled or anon key with write access; overly broad CORS.
  - Injection (SQL/command), SSRF, open proxies that burn the owner's API quota, unrestricted file upload.
Ignore purely theoretical/low-value nits. Rank by real exploitability.

CHECK THE TRACKING ISSUE STATE using the gh CLI, e.g.:
  gh issue list --repo ${it.repo} --state all --limit 20 --json number,title,state,url
Set \`issueState\` to "open"/"closed" based on the security issue's state (or "none" if there is no security tracking issue), and put its URL in \`issueUrl\` (or null).

Set \`risk\` to the CURRENT overall risk = the severity of the worst STILL-OPEN (open or partial) finding; "none" if everything is resolved or nothing was found.

In \`reauditNote\` (1-3 sentences) summarize what changed since the last audit: what they fixed, what remains. Fill \`evidence\` per finding with a file path + short reason. Return the structured object.`,
      { label: `sec:${it.s}`, phase: 'Re-audit', schema: SCHEMA, agentType: 'general-purpose', model: 'sonnet', effort: 'high' }
    ).then((a) => (a ? { project_slug: it.s, repo: it.repo, audit: a } : { project_slug: it.s, repo: it.repo, audit: null }))
  }
)

const ok = results.filter((r) => r && r.audit)
log(`Re-audited ${ok.length}/${items.length} repos`)

return results
