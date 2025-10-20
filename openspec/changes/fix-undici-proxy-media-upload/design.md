# Design: Fix Undici Proxy Media Upload

## Architecture Overview

### Current Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ Evolution API                                                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WhatsappBaileysService.createClient()                │   │
│  │                                                        │   │
│  │  if (localProxy.enabled) {                           │   │
│  │    options = {                                        │   │
│  │      agent: makeProxyAgent(proxy),      ◄─── HTTP/SOCKS Agent
│  │      fetchAgent: makeProxyAgent(proxy)  ◄─── HTTP/SOCKS Agent (❌ INCOMPATIBLE)
│  │    }                                                   │   │
│  │  }                                                     │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Baileys makeWASocket(socketConfig)                   │   │
│  │   - agent: for WebSocket connections                 │   │
│  │   - fetchAgent: for fetch() requests                 │   │
│  └────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Undici (fetch)   │
                    │                  │
                    │ Expects undici   │
                    │ ProxyAgent ❌    │
                    │                  │
                    │ Gets HttpsProxy  │
                    │ Agent instead    │
                    └─────────┬────────┘
                              │
                              ▼
                      TypeError: fetch failed
```

### Proposed Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ Evolution API                                                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ src/utils/makeProxyAgent.ts                          │   │
│  │                                                        │   │
│  │  makeProxyAgent(proxy)                               │   │
│  │    → HttpsProxyAgent | SocksProxyAgent              │   │
│  │      (for WebSocket connections)                     │   │
│  │                                                        │   │
│  │  makeUndiciProxyAgent(proxy) ◄─── NEW               │   │
│  │    → undici.ProxyAgent                               │   │
│  │      (for fetch requests)                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WhatsappBaileysService.createClient()                │   │
│  │                                                        │   │
│  │  if (localProxy.enabled) {                           │   │
│  │    options = {                                        │   │
│  │      agent: makeProxyAgent(proxy),           ✅ HTTP/SOCKS
│  │      fetchAgent: makeUndiciProxyAgent(proxy) ✅ Undici
│  │    }                                                   │   │
│  │  }                                                     │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Baileys makeWASocket(socketConfig)                   │   │
│  │   - agent: HttpsProxyAgent (WebSocket) ✅            │   │
│  │   - fetchAgent: undici.ProxyAgent (fetch) ✅         │   │
│  └────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Undici (fetch)   │
                    │                  │
                    │ Uses undici      │
                    │ ProxyAgent ✅    │
                    │                  │
                    │ Media uploads    │
                    │ succeed          │
                    └─────────┬────────┘
                              │
                              ▼
                  WhatsApp CDN Servers ✅
```

## Component Design

### 1. makeProxyAgent.ts (Updated)

**Current State:**
```typescript
// Returns HttpsProxyAgent or SocksProxyAgent
export function makeProxyAgent(proxy: Proxy | string):
  HttpsProxyAgent<string> | SocksProxyAgent
```

**Proposed Changes:**
```typescript
import { ProxyAgent as UndiciProxyAgent } from 'undici';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Existing function - unchanged, for WebSocket
export function makeProxyAgent(proxy: Proxy | string):
  HttpsProxyAgent<string> | SocksProxyAgent {
  // ... existing implementation
}

// New function - for undici fetch requests
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

**Design Decisions:**
- Keep both functions to maintain separation of concerns
- `makeProxyAgent()` remains unchanged for backward compatibility
- `makeUndiciProxyAgent()` follows same API signature for consistency
- Both support string URLs and Proxy objects
- Both support authenticated proxies

### 2. whatsapp.baileys.service.ts (Updated)

**Changes in `createClient()` method (lines 575-609):**

**Before:**
```typescript
if (this.localProxy?.enabled) {
  // proxyscrape handling...
  options = {
    agent: makeProxyAgent(proxyConfig),
    fetchAgent: makeProxyAgent(proxyConfig)  // ❌ Wrong agent type
  };
}
```

**After:**
```typescript
import { makeProxyAgent, makeUndiciProxyAgent } from '../../utils/makeProxyAgent';

if (this.localProxy?.enabled) {
  // proxyscrape handling...
  options = {
    agent: makeProxyAgent(proxyConfig),           // ✅ For WebSocket
    fetchAgent: makeUndiciProxyAgent(proxyConfig) // ✅ For fetch
  };
}
```

### 3. package.json (Updated)

**Add dependency:**
```json
{
  "dependencies": {
    "undici": "^6.0.0"
  }
}
```

**Note:** Undici is likely already in transitive dependencies via Baileys, but we make it explicit.

## Data Flow

### Media Upload Flow with Proxy

```
1. User sends media via Chatwoot webhook
   ↓
2. ChatwootService.receiveWebhook()
   ↓
3. ChatwootService.sendAttachment()
   ↓
4. BaileysStartupService.mediaMessage()
   ↓
5. BaileysStartupService.prepareMediaMessage()
   │
   ├─ If image: downloads via axios with httpsAgent (localProxy)
   │  └─ Uses makeProxyAgent() for axios ✅
   │
   └─ Calls prepareWAMessageMedia()
      └─ Uses client.waUploadToServer
         └─ Baileys getWAUploadToServer()
            │
            ├─ WebSocket connection (if needed)
            │  └─ Uses socketConfig.agent ✅
            │
            └─ fetch() to CDN servers
               └─ Uses socketConfig.fetchAgent ✅
                  └─ undici.ProxyAgent
                     └─ Success! ✅
```

## Error Handling

### Current Error Cascade
1. **Primary Error**: `TypeError: fetch failed` at undici level
2. **Baileys Retry**: Attempts all CDN hosts, all fail
3. **Secondary Error**: `Media upload failed on all hosts`
4. **Tertiary Error**: `ENOENT` when cleanup tries to delete already-deleted temp files

### After Fix
1. Fetch succeeds with undici ProxyAgent
2. No retry cascade
3. No temp file cleanup errors
4. Media upload completes successfully

## Performance Considerations

### Agent Creation Overhead
- **Current**: Creates 2 agents per proxy-enabled instance (agent + fetchAgent)
- **Proposed**: Still creates 2 agents, but different types
- **Impact**: Negligible - only happens during client initialization

### Memory Usage
- **Additional**: One undici ProxyAgent per instance
- **Estimate**: < 100KB per agent
- **Impact**: Minimal for typical deployments

### Network Performance
- **No change**: Same proxy connection, just different agent wrapper
- **Latency**: Identical to current (when working)
- **Throughput**: Identical to current (when working)

## Security Considerations

### Proxy Authentication
- Both HTTP and SOCKS proxies support authentication
- Credentials handled identically in both agent types
- No plaintext credential logging

### TLS/SSL
- Undici respects Node's certificate validation
- Proxy TLS verified separately from target TLS
- No security downgrade from current implementation

### Data Exposure
- Proxy sees encrypted media (HTTPS to CDN)
- Same exposure level as current implementation
- No additional data leakage

## Testing Strategy

### Unit Tests
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
      username: 'user',
      password: 'pass'
    };
    const agent = makeUndiciProxyAgent(proxy);
    expect(agent).toBeInstanceOf(UndiciProxyAgent);
  });

  it('should support authenticated proxies', () => {
    const agent = makeUndiciProxyAgent('http://user:pass@proxy.example.com:8080');
    expect(agent).toBeInstanceOf(UndiciProxyAgent);
  });
});
```

### Integration Tests
1. **Proxy-enabled media upload**: Send image through proxy, verify success
2. **Non-proxy media upload**: Verify no regression for non-proxy instances
3. **Proxy failure handling**: Verify graceful degradation if proxy unreachable
4. **Multiple media types**: Test image, video, audio, document through proxy

### Manual Testing
1. Configure staging instance with HTTP proxy
2. Send media message via Chatwoot
3. Verify CDN upload succeeds
4. Check logs for no `TypeError: fetch failed`
5. Repeat with SOCKS proxy
6. Test with authenticated proxy

## Rollback Plan

### If Issues Arise
1. **Revert commits**: Simple git revert of changes
2. **Feature flag** (optional): Add `USE_UNDICI_PROXY_AGENT` env var
3. **Fallback**: Remove `fetchAgent` entirely (non-proxy mode)

### Monitoring
- Track error rate: `TypeError: fetch failed`
- Track success rate: Media upload completions
- Track proxy usage: Instances with `localProxy.enabled=true`

## Migration Path

### For Existing Deployments
1. Update package with new code
2. Run `pnpm install` to ensure undici present
3. Restart instances
4. No configuration changes required
5. Proxy settings work automatically

### For New Deployments
- No special handling needed
- Works out of the box with proxy configuration

## Open Questions

1. **Q**: Should we support proxy configuration per media upload?
   **A**: No, instance-level proxy configuration is sufficient

2. **Q**: Do we need separate proxy settings for WebSocket vs fetch?
   **A**: No, same proxy for both is typical and simplifies configuration

3. **Q**: Should we add retry logic for proxy failures?
   **A**: No, Baileys already has retry logic for media uploads

## Future Enhancements

1. **Proxy health checks**: Validate proxy connectivity before use
2. **Proxy pool support**: Rotate through multiple proxies for load balancing
3. **Per-media proxy selection**: Different proxies for different media types
4. **Proxy performance metrics**: Track upload speed through different proxies

## References

- [Baileys Media Upload Documentation](https://deepwiki.com/WhiskeySockets/Baileys)
- [Undici ProxyAgent Documentation](https://undici.nodejs.org/#/docs/api/ProxyAgent)
- [Node.js HTTPS Proxy Agent](https://github.com/TooTallNate/proxy-agents)
