# Documentation Update Plan (DOC_UPDATE_PLAN.md)

This plan details the discrepancies identified between current documentation files and codebase realities during the sitemaps audit, followed by the proposed update plan.

---

## 1. Identified Discrepancies

1. **Overall Completion Metric:**
   - *Current Doc:* Specifies `70%` estimated completion in [PROJECT_CONTEXT.source.md](file:///home/shadow/projects/B1GCRM/docs/PROJECT_CONTEXT.source.md).
   - *Audit Reality:* The computed verified completion metric is `72.0%` overall, based on detailed layer analyses.
2. **WhatsApp QR Connection Status:**
   - *Current Doc:* Classified as "Partial" or "Stubbed" in [FEATURE_TRACKER.md](file:///home/shadow/projects/B1GCRM/docs/FEATURE_TRACKER.md).
   - *Audit Reality:* Since the helper module at [helper/addon/qr/index.js](file:///home/shadow/projects/B1GCRM/helper/addon/qr/index.js) contains no functional code and only returns stubs, it is classified as **Broken** rather than "Partial".
3. **Inbox Media Attachments:**
   - *Current Doc:* Omitted or treated under inbox realtime.
   - *Audit Reality:* Missing. Server does not support files saving/rendering in Inbox, which is a major gap.

---

## 2. Proposed Update Plan

To align the documentation with the code findings, we will update the relevant documents as follows:

1. **Update `docs/PROJECT_CONTEXT.source.md`:**
   - Change `Estimated completion` to `72%`.
   - Update `Last completed feature` to reflect sitemap reverse-engineering.
2. **Update `docs/FEATURE_TRACKER.md`:**
   - Change `WhatsApp QR` status from `Partial/stubbed` to `Broken`.
   - Add `Inbox Media attachments storage` row under Inbox sections.
3. **Update `docs/CURRENT_STATUS.md`:**
   - Shift `QR WhatsApp` from "Partially Implemented" to "Missing or Broken".
4. **Regenerate Context Assets:**
   - Run `npm run docs:ai` to rebuild `docs/PROJECT_CONTEXT.md` and `docs/CHANGELOG_AI.md`.
