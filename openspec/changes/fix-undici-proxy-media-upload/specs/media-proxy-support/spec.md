# Spec: Media Proxy Support

## Capability
`media-proxy-support`

## Description
Enable reliable media uploads to WhatsApp CDN servers through HTTP and SOCKS proxies by using undici-compatible proxy agents for fetch requests in Baileys integration.

---

## ADDED Requirements

### Requirement: System SHALL provide undici proxy agent factory
The system SHALL provide a function `makeUndiciProxyAgent()` that creates undici-compatible proxy agents from proxy configuration.

**ID**: `media-proxy-support-001`
**Priority**: High
**Type**: Functional

#### Scenario: Create undici proxy agent from string URL
- **WHEN** `makeUndiciProxyAgent()` is called with a proxy URL string
- **THEN** it SHALL return an instance of `undici.ProxyAgent`
- **AND** the agent SHALL be configured to use the specified proxy

#### Scenario: Create undici proxy agent from Proxy object
- **WHEN** `makeUndiciProxyAgent()` is called with a Proxy object containing host, port, protocol, username, and password
- **THEN** it SHALL return an instance of `undici.ProxyAgent`
- **AND** the agent SHALL be configured with authentication credentials

---

### Requirement: Baileys service SHALL use undici proxy agents for fetchAgent
The Baileys service SHALL use undici proxy agents for fetchAgent configuration when proxy is enabled.

**ID**: `media-proxy-support-002`
**Priority**: High
**Type**: Functional

#### Scenario: Configure fetch agent with undici proxy when proxy enabled
- **WHEN** the Baileys client is initialized with `localProxy.enabled = true`
- **THEN** the `socketConfig.fetchAgent` SHALL be set to an undici ProxyAgent
- **AND** the `socketConfig.agent` SHALL remain an HttpsProxyAgent or SocksProxyAgent for WebSocket

#### Scenario: No fetch agent when proxy disabled
- **WHEN** the Baileys client is initialized with `localProxy.enabled = false`
- **THEN** the `socketConfig.fetchAgent` SHALL be undefined
- **AND** media uploads SHALL use direct connections to CDN servers

---

### Requirement: Media uploads to WhatsApp CDN SHALL succeed through proxy
Media uploads to WhatsApp CDN SHALL succeed when proxy is configured.

**ID**: `media-proxy-support-003`
**Priority**: High
**Type**: Functional

#### Scenario: Upload image through HTTP proxy
- **WHEN** an Evolution API instance configured with an HTTP proxy attempts to upload an image to WhatsApp CDN
- **THEN** the upload SHALL complete successfully
- **AND** no "TypeError: fetch failed" error SHALL occur
- **AND** the image SHALL be delivered to the recipient

#### Scenario: Upload video through SOCKS proxy
- **WHEN** an Evolution API instance configured with a SOCKS proxy attempts to upload a video to WhatsApp CDN
- **THEN** the upload SHALL complete successfully through the SOCKS proxy
- **AND** the video SHALL be delivered to the recipient

---

### Requirement: System SHALL handle proxy errors gracefully
The system SHALL handle proxy-related errors gracefully and provide meaningful error messages.

**ID**: `media-proxy-support-004`
**Priority**: Medium
**Type**: Functional

#### Scenario: Retry on transient proxy failure
- **WHEN** a media upload fails due to transient proxy failure
- **THEN** Baileys' built-in retry logic SHALL attempt alternate CDN hosts
- **AND** if retry succeeds, the upload SHALL complete
- **AND** if all retries fail, a clear error message SHALL be logged

#### Scenario: Prevent ENOENT errors on upload failure
- **WHEN** a media upload fails due to proxy issues and Baileys attempts to clean up temporary encrypted files
- **THEN** file cleanup SHALL handle already-deleted files gracefully
- **AND** no "ENOENT: no such file or directory" errors SHALL be logged

---

### Requirement: Changes SHALL maintain backward compatibility
The changes SHALL maintain backward compatibility with existing functionality.

**ID**: `media-proxy-support-005`
**Priority**: High
**Type**: Non-Functional

#### Scenario: Non-proxy instances work unchanged
- **WHEN** media messages are sent from an instance with `localProxy.enabled = false` or undefined
- **THEN** uploads SHALL work exactly as before the changes
- **AND** no regression SHALL occur in non-proxy scenarios

#### Scenario: WebSocket proxy continues to work
- **WHEN** the WebSocket connection to WhatsApp is established with proxy enabled
- **THEN** it SHALL use the existing `makeProxyAgent()` function
- **AND** WebSocket communication SHALL work as before

---

### Requirement: Proxy agent implementation SHALL have minimal performance impact
The proxy agent implementation SHALL have minimal performance impact.

**ID**: `media-proxy-support-006`
**Priority**: Low
**Type**: Non-Functional

#### Scenario: Agent creation overhead is negligible
- **WHEN** a new Evolution API instance is initialized with proxy enabled
- **THEN** proxy agent creation SHALL increase initialization time by less than 100ms
- **AND** memory usage SHALL increase by less than 1MB per instance

#### Scenario: Media upload performance through proxy
- **WHEN** a media upload is performed through a proxy-enabled instance
- **THEN** the upload speed SHALL depend only on proxy network performance
- **AND** no additional overhead SHALL be introduced by the agent implementation

---

## Dependencies

**Internal:**
- Baileys integration (`whatsapp.baileys.service.ts`)
- Proxy utility (`makeProxyAgent.ts`)

**External:**
- `undici` package for ProxyAgent implementation
- `@whiskeysockets/baileys` for WhatsApp client

**Related Capabilities:**
- None (new standalone capability)

---

## Notes

### Implementation Considerations
1. The `undici` package is likely already present as a transitive dependency of Baileys, but should be added explicitly to `package.json` for clarity
2. Both `makeProxyAgent()` and `makeUndiciProxyAgent()` should remain exported for potential future use cases
3. Proxy agent reuse: Consider caching agents per proxy configuration to avoid repeated creation

### Testing Notes
1. Manual testing requires access to HTTP and SOCKS proxy servers
2. Proxyscrape testing requires network access to fetch proxy lists
3. Authenticated proxy testing requires test proxy credentials

### Security Notes
1. Proxy credentials are handled identically to current implementation
2. No additional security risks introduced
3. TLS verification continues to work through proxy

### Future Considerations
1. Consider adding proxy health checks before use
2. Consider support for proxy failover/rotation
3. Consider separate proxy configurations for WebSocket vs media uploads
