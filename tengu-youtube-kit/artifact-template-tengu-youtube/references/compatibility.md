# Codex and Claude Code

This package uses the common Agent Skills layout: SKILL.md with name and description plus relative scripts/references/assets. No model-specific system prompt, tools whitelist, hooks, account credentials or provider API is needed.

## Local installation

Codex personal location: ~/.codex/skills/artifact-template-tengu-youtube/
Claude Code personal location: ~/.claude/skills/artifact-template-tengu-youtube/

Keep the whole directory, not just SKILL.md. Codex also uses artifact-template.json and agents/openai.yaml. Claude Code can use SKILL.md and its relative resources without those Codex metadata files.

Invocation:
- Codex: $artifact-template-tengu-youtube followed by the episode topic.
- Claude Code: /artifact-template-tengu-youtube followed by the episode topic.

If a current session does not discover a newly installed skill, open a new session. Installation in ~/.claude/skills is for Claude Code on that machine; it is not an upload to Claude.ai, Cowork or a synced account-wide installation.

## Dependencies and tools

The starter and structural validator use Node.js built-in libraries only. A local HTTP server is needed to view the separate script. Browser QA can use the host's available browser or Playwright. Optional Remotion intro rebuilding needs its package dependencies, but exported MP4s are included.

Use the host's relevant workflows for image generation, external research and Cloudflare. Default complete delivery includes RU+EN on tengucluster.com; see [publishing.md](publishing.md). Neither host needs Sites for this destination. Prefer an already authenticated Cloudflare MCP or the official API/CLI available on that host. Codex and Claude credentials are not automatically shared: inspect access, never copy tokens between their credential stores. If access is absent, keep the validated public package and private scripts local and report the missing step. Do not claim unavailable tools ran.

The read-only audit-public.mjs helper uses Node built-ins. It validates an explicit public inventory, hashes and RU/EN entry points; it neither uploads nor handles credentials. This whole skill, including retained scripts under assets/source, is private and must never be used as an upload root.

## Reference documentation

Checked 22 October 2026:
- Codex skills: https://learn.chatgpt.com/docs/build-skills
- Claude Code skills: https://code.claude.com/docs/en/skills

The common package is deliberately simpler than provider-specific options. Recheck these docs if an installation path or invocation behavior changes.
