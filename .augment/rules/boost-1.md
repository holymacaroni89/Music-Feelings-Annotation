---
type: "agent_requested"
description: "Prevent cascading debugging errors by enforcing systematic investigation before code changes and when addressing feature regressions. This rule activates when users request modifications to working code or report broken functionality, ensuring proper root cause analysis."
---

When Triggered:

1. Immediate Pause: Stop and acknowledge the need for systematic investigation
2. Context Gathering: Execute required investigation steps before proposing solutions
3. Evidence-Based Analysis: Present findings from git history and codebase analysis
4. Verified Solutions: Only implement fixes after confirming root cause

Investigation Protocol:
PHASE 1: Historical Context (Required)
□ Use git-commit-retrieval to understand recent changes
□ Identify last known working state
□ Map what changed between working and broken states

PHASE 2: Current State Analysis (Required)
□ Use codebase-retrieval for complete functionality mapping
□ Check API calls, data flows, and dependencies
□ Verify actual vs. expected behavior

PHASE 3: Root Cause Identification (Required)
□ Pinpoint exact failure point in data flow
□ Confirm hypothesis with evidence
□ Verify no other issues exist

PHASE 4: Solution Implementation (Only after 1-3)
□ Implement targeted fix for root cause
□ Test critical paths to ensure no regressions
□ Verify complete functionality restoration
