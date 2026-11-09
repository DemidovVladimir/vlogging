# Prompt for Claude

Continue the Margin YouTube transcript application using your existing knowledge of our Cloudflare account and `tengucluster.com` deployment.

First read:

```text
/Users/vladimirdemidov/development/vlogging/margin-cloudflare-handoff/README.md
/Users/vladimirdemidov/development/vlogging/margin-cloudflare-handoff/HANDOFF.md
/Users/vladimirdemidov/development/vlogging/margin-cloudflare-handoff/API.md
/Users/vladimirdemidov/development/vlogging/margin-cloudflare-handoff/VERIFICATION.md
```

The working source is `/Users/vladimirdemidov/development/vlogging/youtube-reader`. The handoff's `app/` folder is a source snapshot for comparison.

The objective is a working, private, hosted application under our domain. It must extract actual YouTube captions, save transcripts, search them, and export them. It must work without a Python process running on my Mac. `reader.tengucluster.com` was proposed; confirm the appropriate location using your existing infrastructure context.

Use my preferences from chaos-kb before making design decisions. Known preferences are a dark workspace, neon futuristic cyberpunk inspired by Blade Runner, and simple, precise wording. Preserve readable text. Define technical terms with inline hover/focus explanations when needed.

Inspect the existing site, routing, authentication, and deployment process. Reuse appropriate existing infrastructure. Implement and test the hosted backend, persistent storage, and private access. Preserve the existing TENGU site and unrelated applications.

Verify a real extraction from the deployed environment. A screenshot or an HTTP 200 response is insufficient. Test persistence after reopening, exports, CSS/JavaScript loading, and access restrictions on every deployed hostname.

A transcript provider, API key, hostname, and Access setup were discussed but not selected or configured. Use existing approved services from your context if available. Prepare and test independent work before asking for missing credentials or decisions. Do not start a paid subscription or automatic recharge based on the previous recommendations alone.

Report the working URL, validation results, remaining limitations, and rollback procedure. Identify any required user action precisely.
