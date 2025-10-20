# Tasks: Fix Undici Proxy Media Upload

## Overview
Implementation tasks to fix proxy agent compatibility for Baileys media uploads, ordered for incremental delivery and testing.

---

## Phase 1: Foundation (Core Fix)

### Task 1.1: Add undici dependency
**Estimated effort**: 5 minutes
**Verifiable outcome**: `undici` appears in package.json dependencies

**Steps:**
1. Add `"undici": "^6.0.0"` to `package.json` dependencies section
2. Run `pnpm install` to install the package
3. Verify installation: `pnpm list undici`
4. Commit: `chore(deps): add undici for proxy agent support`

**Validation:**
- [x] `undici` appears in `package.json` under `dependencies`
- [x] `pnpm-lock.yaml` updated with undici entry
- [x] No dependency conflicts reported by pnpm

---

### Task 1.2: Implement makeUndiciProxyAgent function
**Estimated effort**: 30 minutes
**Verifiable outcome**: New function creates undici ProxyAgent instances

**Steps:**
1. Open `src/utils/makeProxyAgent.ts`
2. Import `ProxyAgent` from `undici`
3. Add `makeUndiciProxyAgent()` function below existing `makeProxyAgent()`
4. Implement string URL handling
5. Implement Proxy object handling with authentication
6. Export the new function
7. Add JSDoc comments
8. Commit: `feat(proxy): add makeUndiciProxyAgent for fetch requests`

**Implementation:**
```typescript
import { ProxyAgent as UndiciProxyAgent } from 'undici';

/**
 * Creates an undici-compatible proxy agent for fetch requests.
 * Used by Baileys for media uploads to WhatsApp CDN servers.
 *
 * @param proxy - Proxy URL string or Proxy configuration object
 * @returns UndiciProxyAgent configured for the specified proxy
 */
export function makeUndiciProxyAgent(proxy: Proxy | string): UndiciProxyAgent {
  if (typeof proxy === 'string') {
    return new UndiciProxyAgent(proxy);
  }

  const { host, password, port, protocol, username } = proxy;
  let proxyUrl = `${protocol}://${host}:${port}`;

  if (username && password) {
    proxyUrl = `${protocol}://${username}:${password}@${host}:${port}`;
  }

  return new UndiciProxyAgent(proxyUrl);
}
```

**Validation:**
- [x] Function compiles without TypeScript errors
- [x] Function is exported from `makeProxyAgent.ts`
- [x] JSDoc comments are present and accurate

---

### Task 1.3: Update Baileys client initialization
**Estimated effort**: 20 minutes
**Verifiable outcome**: Baileys uses undici proxy agent for fetchAgent

**Steps:**
1. Open `src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts`
2. Import `makeUndiciProxyAgent` from `../../utils/makeProxyAgent`
3. Locate the `createClient()` method (line 549)
4. Find the proxy configuration block (lines 575-609)
5. Update the `fetchAgent` assignment to use `makeUndiciProxyAgent()`
6. Keep `agent` using existing `makeProxyAgent()`
7. Test TypeScript compilation
8. Commit: `fix(baileys): use undici proxy agent for media uploads`

**Code changes in `createClient()` method:**
```typescript
// Around line 575-609
if (this.localProxy?.enabled) {
  this.logger.info('Proxy enabled: ' + this.localProxy?.host);

  if (this.localProxy?.host?.includes('proxyscrape')) {
    try {
      const response = await axios.get(this.localProxy?.host);
      const text = response.data;
      const proxyUrls = text.split('\r\n');
      const rand = Math.floor(Math.random() * Math.floor(proxyUrls.length));
      const proxyUrl = 'http://' + proxyUrls[rand];
      options = {
        agent: makeProxyAgent(proxyUrl),           // WebSocket agent
        fetchAgent: makeUndiciProxyAgent(proxyUrl) // Fetch agent (CHANGED)
      };
    } catch {
      this.localProxy.enabled = false;
    }
  } else {
    const proxyConfig = {
      host: this.localProxy.host,
      port: this.localProxy.port,
      protocol: this.localProxy.protocol,
      username: this.localProxy.username,
      password: this.localProxy.password,
    };
    options = {
      agent: makeProxyAgent(proxyConfig),           // WebSocket agent
      fetchAgent: makeUndiciProxyAgent(proxyConfig) // Fetch agent (CHANGED)
    };
  }
}
```

**Validation:**
- [x] TypeScript compiles without errors
- [x] Both proxy configuration paths updated (proxyscrape and direct)
- [x] Import statement for `makeUndiciProxyAgent` added
- [x] Existing `makeProxyAgent` import remains

---

## Phase 2: Testing

### Task 2.1: Unit test makeUndiciProxyAgent
**Estimated effort**: 45 minutes
**Verifiable outcome**: Unit tests pass for new proxy agent function

**Steps:**
1. Create or update test file for `makeProxyAgent.ts`
2. Add test cases for string URL input
3. Add test cases for Proxy object input
4. Add test cases for authenticated proxies
5. Run tests: `npm test`
6. Commit: `test(proxy): add unit tests for makeUndiciProxyAgent`

**Test cases:**
```typescript
describe('makeUndiciProxyAgent', () => {
  it('should create ProxyAgent from string URL', () => {
    const agent = makeUndiciProxyAgent('http://proxy.example.com:8080');
    expect(agent).toBeInstanceOf(UndiciProxyAgent);
  });

  it('should create ProxyAgent from Proxy object', () => {
    const proxy = {
      host: 'proxy.example.com',
      port: 8080,
      protocol: 'http',
      username: undefined,
      password: undefined
    };
    const agent = makeUndiciProxyAgent(proxy);
    expect(agent).toBeInstanceOf(UndiciProxyAgent);
  });

  it('should support authenticated proxies', () => {
    const proxy = {
      host: 'proxy.example.com',
      port: 8080,
      protocol: 'http',
      username: 'testuser',
      password: 'testpass'
    };
    const agent = makeUndiciProxyAgent(proxy);
    expect(agent).toBeInstanceOf(UndiciProxyAgent);
  });

  it('should handle SOCKS proxies', () => {
    const agent = makeUndiciProxyAgent('socks://proxy.example.com:1080');
    expect(agent).toBeInstanceOf(UndiciProxyAgent);
  });
});
```

**Validation:**
- [ ] All unit tests pass
- [ ] Test coverage includes both input types
- [ ] Test coverage includes authentication scenarios

---

### Task 2.2: Integration test with test proxy
**Estimated effort**: 1 hour
**Verifiable outcome**: Media upload succeeds through test proxy

**Prerequisites:**
- Access to test HTTP proxy
- Test Evolution API instance
- Test WhatsApp instance connected

**Steps:**
1. Configure test instance with proxy settings:
   ```env
   PROXY_ENABLED=true
   PROXY_HOST=test-proxy.example.com
   PROXY_PORT=8080
   PROXY_PROTOCOL=http
   ```
2. Restart test instance
3. Send test media message via Chatwoot webhook
4. Check logs for successful upload
5. Verify no "TypeError: fetch failed" errors
6. Verify media delivered to recipient
7. Document test results

**Validation:**
- [ ] Media upload completes without errors
- [ ] Logs show proxy connection established
- [ ] Recipient receives media message
- [ ] No ENOENT errors in logs

---

### Task 2.3: Regression test non-proxy instances
**Estimated effort**: 30 minutes
**Verifiable outcome**: Non-proxy instances work unchanged

**Steps:**
1. Configure test instance with proxy disabled:
   ```env
   PROXY_ENABLED=false
   ```
2. Restart test instance
3. Send test media message
4. Verify upload succeeds via direct connection
5. Compare performance with pre-change baseline
6. Document test results

**Validation:**
- [ ] Media uploads work in non-proxy mode
- [ ] No performance regression
- [ ] No new error patterns in logs

---

## Phase 3: Documentation & Deployment

### Task 3.1: Update CHANGELOG.md
**Estimated effort**: 15 minutes
**Verifiable outcome**: CHANGELOG entry describes the fix

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry under appropriate version section:
   ```markdown
   ### Fixed
   - Fixed media upload failures through proxy by using undici-compatible proxy agents for fetch requests to WhatsApp CDN servers (#issue-number)
   ```
3. Include details about the TypeError: fetch failed fix
4. Commit: `docs: update CHANGELOG for proxy media upload fix`

**Validation:**
- [ ] CHANGELOG entry is clear and accurate
- [ ] Entry is in correct version section
- [ ] Related issue/PR numbers included

---

### Task 3.2: Update documentation for proxy configuration
**Estimated effort**: 20 minutes
**Verifiable outcome**: Proxy docs mention media upload support

**Steps:**
1. Update relevant proxy configuration docs
2. Add note about media upload support through proxy
3. Include troubleshooting section for proxy issues
4. Commit: `docs: clarify proxy support for media uploads`

**Validation:**
- [ ] Documentation updated
- [ ] Proxy configuration examples remain valid
- [ ] Troubleshooting tips added

---

### Task 3.3: Deploy to staging
**Estimated effort**: 30 minutes (plus monitoring time)
**Verifiable outcome**: Staging instances run new code successfully

**Steps:**
1. Build production bundle: `npm run build`
2. Deploy to staging environment
3. Monitor logs for 1 hour
4. Test media uploads through proxy
5. Verify no new errors introduced
6. Get approval for production deploy

**Validation:**
- [ ] Staging build succeeds
- [ ] Staging instances start successfully
- [ ] No critical errors in staging logs
- [ ] Test media uploads work
- [ ] Approval obtained

---

### Task 3.4: Deploy to production
**Estimated effort**: 1 hour (plus monitoring time)
**Verifiable outcome**: Production instances run new code successfully

**Steps:**
1. Create production release tag
2. Deploy to production instances (rolling update)
3. Monitor error rates during rollout
4. Check media upload success rates
5. Monitor for 24 hours post-deploy
6. Update issue/ticket status

**Validation:**
- [ ] Production deploy completes
- [ ] Error rate remains stable or decreases
- [ ] Media upload success rate improves
- [ ] No critical incidents reported
- [ ] 24-hour monitoring shows stability

---

## Phase 4: Cleanup & Optimization (Optional)

### Task 4.1: Add proxy health check (future)
**Estimated effort**: 2 hours
**Verifiable outcome**: System validates proxy connectivity before use

**Deferred**: Low priority, can be implemented later if needed

---

### Task 4.2: Add proxy performance metrics (future)
**Estimated effort**: 3 hours
**Verifiable outcome**: Dashboard shows proxy upload performance

**Deferred**: Low priority, can be implemented later if needed

---

## Dependencies & Blockers

**Sequential Dependencies:**
- Task 1.2 depends on Task 1.1 (need undici installed)
- Task 1.3 depends on Task 1.2 (need makeUndiciProxyAgent implemented)
- Task 2.x depends on Phase 1 completion (need core fix in place)
- Task 3.3 depends on Phase 2 completion (need testing done)
- Task 3.4 depends on Task 3.3 (staging approval required)

**Parallelizable Work:**
- Task 2.1, 2.2, 2.3 can run in parallel (different test types)
- Task 3.1 and 3.2 can run in parallel (independent docs)

**External Blockers:**
- Task 2.2 requires access to test proxy server
- Task 3.3 requires staging environment access
- Task 3.4 requires production deploy permissions

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate rollback** (5 minutes):
   ```bash
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

2. **Partial rollback** (10 minutes):
   - Add feature flag: `USE_UNDICI_PROXY=false` env var
   - Conditionally use old agent in code
   - Deploy with feature flag disabled

3. **Investigation** (ongoing):
   - Collect error logs from affected instances
   - Reproduce issue in staging
   - Fix and redeploy

---

## Success Metrics

**Technical Metrics:**
- [ ] Zero "TypeError: fetch failed" errors for proxy-enabled instances
- [ ] Media upload success rate >99% through proxy
- [ ] No increase in ENOENT temporary file errors
- [ ] Build time increase <5 seconds
- [ ] Bundle size increase <100KB

**Business Metrics:**
- [ ] Reduced support tickets about media upload failures
- [ ] Increased usage of proxy-enabled instances
- [ ] Positive user feedback on reliability

---

## Estimated Total Effort

- **Phase 1 (Foundation)**: 55 minutes
- **Phase 2 (Testing)**: 2.25 hours
- **Phase 3 (Deployment)**: 1.75 hours
- **Total Core Work**: ~4.5 hours
- **Monitoring & Support**: 24 hours (passive)

**Critical path**: Phase 1 → Phase 2 → Phase 3 (sequential)
