---
name: API codegen compatibility
description: Compatibility constraint around the repository's tracked OpenAPI-generated API files.
---

The tracked generated API artifacts contain legacy order response fields that are not fully represented by the current OpenAPI document. Regenerating them can remove fields such as legacy member-order metadata or alter response parsing even when the intended feature is unrelated.

**Why:** A PIN validation change caused the current generator to rewrite generated output broadly and change existing response schemas, so the unrelated generated changes had to be discarded.

**How to apply:** Before running API codegen for a narrow backend change, inspect the complete generated diff and preserve existing legacy response compatibility unless the user explicitly requests an API contract migration.