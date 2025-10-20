# Proposal: Fix Undici Proxy Media Upload

## Change ID
`fix-undici-proxy-media-upload`

## Title
Fix proxy agent compatibility for media uploads to WhatsApp CDN

## Status
Proposed

## Overview
When Evolution API is configured with a proxy (`localProxy.enabled = true`), media uploads to WhatsApp CDN servers fail with `TypeError: fetch failed`. This occurs because the current implementation uses `https-proxy-agent` or `socks-proxy-agent` for the `fetchAgent` configuration in Baileys, but Baileys internally uses Node's `undici` fetch implementation which requires an undici-compatible `ProxyAgent`.

## Why

Users in corporate environments or regions requiring proxy access cannot send media messages through WhatsApp, resulting in failed customer communications and support tickets. The current implementation causes systematic media upload failures for all proxy-enabled instances due to agent type incompatibility between Evolution API's proxy configuration and Baileys' fetch implementation.

## What Changes

- Add `undici` package to dependencies in `package.json`
- Create new `makeUndiciProxyAgent()` function in `src/utils/makeProxyAgent.ts` that returns undici-compatible proxy agents
- Update Baileys client initialization in `src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts` to use `makeUndiciProxyAgent()` for `fetchAgent` configuration
- Keep existing `makeProxyAgent()` function for WebSocket connections (no breaking changes)

## Impact

- **Affected specs**: `media-proxy-support` (new capability)
- **Affected code**:
  - `src/utils/makeProxyAgent.ts` - Add new function
  - `src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts` - Update proxy configuration (lines 586-609)
  - `package.json` - Add undici dependency

## Problem Statement
Users experience the following errors when sending media messages through a proxy:
```
TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
    at async Object.upload (baileys/lib/Utils/messages-media.js:524:34)
```

Followed by:
```
Error: Media upload failed on all hosts
Error: ENOENT: no such file or directory, open '/tmp/image3EB055FC1F884D11528E54-enc'
```

The root cause is **agent type incompatibility**: `makeProxyAgent()` returns `HttpsProxyAgent` or `SocksProxyAgent` (from `https-proxy-agent`/`socks-proxy-agent` packages), but Baileys' `fetch` implementation expects an undici-compatible agent.

## Affected Components
- `src/utils/makeProxyAgent.ts` - Proxy agent factory
- `src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts` - Baileys client initialization (lines 549-692, specifically 586-609)
- `package.json` - Dependencies

## Proposed Solution
Implement undici-compatible proxy agent support alongside existing WebSocket proxy agents:

1. **Add undici dependency** to support `ProxyAgent` from the `undici` package
2. **Create new function** `makeUndiciProxyAgent()` that returns undici-compatible proxy agents
3. **Update `createClient` method** to use undici proxy agent for `fetchAgent` configuration
4. **Maintain backward compatibility** by keeping existing `makeProxyAgent()` for WebSocket connections

## Success Criteria
- Media messages send successfully through proxy-enabled instances
- No `TypeError: fetch failed` errors when uploading to WhatsApp CDN
- No ENOENT errors for temporary encrypted media files
- WebSocket connections continue to work with existing proxy configuration
- Both HTTP and SOCKS proxy protocols are supported

## Alternative Approaches Considered
1. **Global undici dispatcher**: Would affect all fetch requests globally, not scoped to Baileys
2. **Disable proxy for media uploads**: Defeats the purpose of proxy configuration for environments that require it
3. **Migrate all agents to undici**: Breaking change, unnecessary complexity

## Dependencies
- No dependencies on other changes
- Requires adding `undici` package (likely already in transitive dependencies via Baileys)

## Testing Strategy
- Unit test: Verify `makeUndiciProxyAgent()` returns undici-compatible agents
- Integration test: Send media message through proxy-enabled instance
- Manual test: Test with both HTTP and SOCKS proxies
- Regression test: Verify non-proxy instances continue to work

## Rollout Plan
1. Implement changes in development environment
2. Test with staging proxy configuration
3. Deploy to production
4. Monitor error logs for media upload failures

## Impact Assessment
- **User Impact**: Positive - fixes broken media uploads for proxy users
- **Performance**: Negligible - only affects agent initialization
- **Breaking Changes**: None - additive change, existing behavior preserved
- **Security**: Positive - enables secure media uploads through corporate proxies
