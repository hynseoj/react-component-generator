---
name: deep-research
description: Research a specified topic through web-source collection, independent validation, and a synthesized cited report. Use when the user wants an evidence-backed research report rather than a quick answer.
---

# Deep Research

Produce a defensible, source-cited report for the user's specified topic through the three stages below. Keep collection, validation, and synthesis distinct: do not treat an unverified source claim as a conclusion.

Use the named agent roles registered in the workspace's `.codex/config.toml`: `researcher`, `evaluator`, and `synthesizer`. Their role files are `.codex/agents/researcher.toml`, `.codex/agents/evaluator.toml`, and `.codex/agents/synthesizer.toml`. Spawn agents by their registered role (`agent_type`), not merely by naming a general-purpose agent. The researcher role must enforce read-only permissions; a prompt alone does not satisfy this requirement. If the roles are unavailable in the current session, report the missing registration instead of silently substituting unrestricted agents.

## 1. Collect

Create or invoke the registered `researcher` subagent with the Luna model (`gpt-6-luna`) and its read-only permission profile. Prohibit it from modifying files, making external mutations, installing packages, or changing Git state. Return the evidence packet to the orchestrating agent through the subagent result.

Provide the topic, scope, relevant date range, and any user constraints. Ask it to use web search and return a structured research packet containing:

- candidate claims, with the source URL, publisher, publication/update date, and a concise supporting summary;
- a query log plus a source record for each source: canonical URL, source type and first-hand/secondary status, access date, and an evidence locator (section, page, table, or timestamp);
- exact uncertainty, disagreements, missing data, and potential conflicts of interest; and
- a source list that favors primary and authoritative material.

The researcher may gather evidence but must not write the final report or present unsupported inferences as facts. Search snippets and inaccessible pages are leads, not verified evidence, and must be identified as such.

## 2. Verify

Send the research packet to the existing registered `evaluator` role in research-validation mode. The evaluator must independently test each material claim against the cited sources and, where useful, additional authoritative sources. It should label claims as **supported**, **partially supported**, **unsupported**, **outdated**, or **conflicted**, explain its reasoning, and identify gaps that require more collection.

If a material gap is found, return to collection with a targeted request. Do not proceed to synthesis while a central claim is unsupported or materially conflicted; instead, report the limitation.

## 3. Synthesize

Create or invoke the registered `synthesizer` subagent with the Sol model (`gpt-6.1-sol`). Give it the original request, the research packet, and the evaluator's verdicts. It must synthesize only the supported evidence, clearly distinguish facts from inference, and preserve important uncertainty and source disagreement.

Save the final Markdown report in `.agent/reports/` under the current workspace, creating that directory if it does not exist. Use a filesystem-safe, descriptive filename based on the topic (for example, `battery-recycling-2026-10-08.md`); never overwrite an existing report—add a numeric suffix instead.

The report must include:

1. title, research date, scope, and a short executive summary;
2. findings organized around the user's question, with inline Markdown links to sources;
3. a verification notes section that records material caveats, disputed claims, and limitations; and
4. a source list with publisher and publication date where available.

Return the report path and a brief summary to the user. Do not expose source content beyond what is needed for the report, and comply with source quotation limits.
