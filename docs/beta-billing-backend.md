# PureAutoLike Beta And Billing Backend

## Current Mode

The extension is prepared for a future paid subscription, but the current release is free beta.

- Popup shows a visible `BETA` badge.
- Background service worker owns license checks.
- Content scripts never receive billing secrets or payment state beyond the allowed/blocked runner result.
- `LICENSE_API_BASE` points to the deployed Cloudflare Worker license endpoint.
- Published Chrome Web Store extension id:
  `abamkpcdpihjpaomdpaklhifpfbobgmm`.
- The extension does not grant local beta access when the license endpoint is missing or unavailable; free beta access is returned by the backend while `BETA_ENABLED=true`.

## Future Paid Switch

When paid access is enabled:

1. Keep `backend/license-worker` deployed to Cloudflare Workers.
2. Apply `backend/license-worker/schema.sql` to Cloudflare D1.
3. Set Worker vars:
   - `BETA_ENABLED=true` while the extension is free.
   - `BETA_ENABLED=false` when paid access should be enforced.
   - `ALLOWED_EXTENSION_IDS=abamkpcdpihjpaomdpaklhifpfbobgmm`.
   - `CHECKOUT_URL=<payment checkout url>`.
   - `WEBHOOK_SECRET=<random shared secret for billing webhooks>`.
4. Verify the exact backend origin is present in Chrome manifest `host_permissions`.
5. Publish the update through Chrome Web Store before turning beta off.

## License Flow

```text
popup -> background: pal-license-check
background -> backend: POST /v1/license/check
backend -> background: access/mode/plan/label
background -> popup: render BETA/LOCKED/paid status
content -> background: pal-runner-claim
background -> backend/cache: verify access before runner lock
```

If `access=false`, the background worker denies `pal-runner-claim`, and the autoliker cannot start from an updated extension.

## Endpoints

```text
GET  /v1/config
POST /v1/install/bootstrap
POST /v1/license/check
POST /v1/billing/checkout
POST /v1/billing/webhook
```

The deployed worker returns `BETA` access while `BETA_ENABLED=true`. If the
worker is unavailable or returns `access=false`, the extension blocks runner
startup.

## Chrome Web Store Notes

Before switching to paid access:

- Update the Chrome Web Store listing and dashboard to disclose in-app purchases/subscription behavior.
- Update privacy disclosures if the backend stores email, installation id, checkout ids, or license check telemetry.
- Keep the backend origin narrow in `host_permissions`; avoid wildcard origins.
- Publish paid enforcement only through Chrome Web Store so existing normal users auto-update.

## Limits

This blocks updated Chrome Web Store users and current release artifacts that
contain the license check. It cannot revoke old manually installed ZIP builds
that predate license checks or have auto-update disabled.
