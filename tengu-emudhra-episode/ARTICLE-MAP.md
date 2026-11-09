# EP.03 · editorial brief / revision 4

Private production note. Do not upload this file or the working dist folders.

Audience: technically curious adults. Central question: where does an incident response become protection for a running application?

The Cloudflare article sets the narrative order, not wording. This is a compact independent explanation with original diagrams and supporting product documentation, not a translated replacement for the article. Readers can open the full original from the viewer.

| Scene | Narrative job | Visual change | Evidence |
| --- | --- | --- | --- |
| 01 | Establish the failure of server identity | Encrypted connection remains; identity warning appears | Google incident report; Cloudflare status qualification |
| 02 | Show the provider as a TLS client | Origin/API connections and updated verification appear | Cloudflare response; Full (strict) docs |
| 03 | Distinguish available fix from active fix | Old instance → deployment → changed rejection | Original illustration; Docker and Node.js docs |
| 04 | Locate customer-installed software | Client releases → running Tunnel image → Gateway condition | Cloudflare customer guidance; cloudflared release |
| 05 | Separate server and client authentication | Verification arrow reverses between origin TLS and mTLS | Full (strict) and custom-CA docs |
| 06 | Explain the container boundary | External-server verification moves to Cloudflare | Containers HTTPS interception docs |
| 07 | Follow the actual dependency path | SDK highlight moves to TLS; unknown app result becomes tested rejection | Requests, curl, Dennis Jackson |
| 08 | Explain the longer-term lesson | Rapid browser block → Linux integration → operational takeaway | Mozilla OneCRL; Canonical upki |

No repeated P-384 arithmetic, key recovery demo, cross-signing digression or Go version lecture. Those are useful in a different deep dive. Platform download matrices stay at the linked vendor source rather than becoming tiny slide text. The cloudflared security release is a dated example, not a claim that it is the latest release forever.

The private SCRIPT files contain the spoken narrative. STORY-PLAN files give timings and phase cues. The page contains only viewer text and diagrams; sources are links, not narration downloads.

No live certificate tests, exploits, outbound HTTPS interception configuration, trust-store edits or system updates are performed by the deck or this production workflow.
