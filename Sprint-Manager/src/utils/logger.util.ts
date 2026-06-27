/**
 * Centralized Forge logging utility.
 *
 * Log format (visible in developer console → Details → description):
 *
 *   Remote-correlated log (can be matched in Spring Boot via Trace ID):
 *     [Module][operation] key=value | message
 *
 *   Forge-only log (no backend HTTP call involved — prefix [LOCAL]):
 *     [LOCAL][Module][operation] key=value | message
 *
 * Use `log.local*` methods for operations that are ENTIRELY within the Forge
 * runtime (KVS reads/writes, permission checks, local data processing).
 * These do NOT correspond to any Spring Boot log entry.
 *
 * Use `log.info/warn/error/debug` (no LOCAL prefix) for operations that
 * DO invoke the remote backend — the Trace ID in the Forge developer console
 * will link those logs to entries in the Spring Boot log file.
 *
 * Correlation with Spring Boot remote logs:
 *   Forge console Trace ID format: traceId-spanId
 *   e.g.  6c0b6bbe1ad246c09374d90a2ad0403a-b7b7cf1e7cab3a4c
 *   Spring Boot log shows: [tid=6c0b6bbe1ad246c09374d90a2ad0403a-b7b7cf1e7cab3a4c]
 *   Grep:  grep "tid=6c0b6bbe1ad246c09374d90a2ad0403a-b7b7cf1e7cab3a4c" debug.log
 *
 * Privacy: never log email addresses, passwords, API keys, or auth tokens.
 * Forge limits: 100 log lines per runtime-minute — keep INFO calls minimal.
 */

type Meta = Record<string, string | number | boolean | undefined | null>;

function formatMeta(meta?: Meta): string {
    if (!meta) return '';
    const pairs = Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${v}`);
    return pairs.length > 0 ? `${pairs.join(' ')} ` : '';
}

function buildMessage(module: string, operation: string, message: string, meta?: Meta, local?: boolean): string {
    const prefix = local ? '[LOCAL]' : '';
    return `${prefix}[${module}][${operation}] ${formatMeta(meta)}| ${message}`;
}

/**
 * ForgeLogger — one instance per module (service, resolver, or util).
 *
 * @example
 * ```typescript
 * const log = new ForgeLogger('UsersResolver');
 *
 * // Remote-correlated: a backend HTTP call will happen; tid links to Spring Boot log
 * log.info('getTotalUsers', 'Fetching total user count from backend');
 *
 * // Forge-only: KVS read, no backend HTTP call; no corresponding Spring Boot entry
 * log.localInfo('getTotalUsers', 'KVS group GUID resolved', { groupGuid: guid });
 * ```
 */
export class ForgeLogger {
    constructor(private readonly module: string) {}

    // ── Remote-correlated logs ─────────────────────────────────────────────
    // Use for operations that DO call the remote backend.
    // The Forge Trace ID in the developer console links these to Spring Boot logs.

    /** INFO for remote-involved events: operation entry, remote success, business outcome. */
    info(operation: string, message: string, meta?: Meta): void {
        console.log(buildMessage(this.module, operation, message, meta));
    }

    /** WARN for unexpected remote states (e.g. non-2xx that was handled gracefully). */
    warn(operation: string, message: string, meta?: Meta): void {
        console.warn(buildMessage(this.module, operation, message, meta));
    }

    /** ERROR for remote HTTP failures and unexpected exceptions. Pass the Error object. */
    error(operation: string, message: string, error?: unknown, meta?: Meta): void {
        const msg = buildMessage(this.module, operation, message, meta);
        if (error !== undefined) {
            console.error(msg, error);
        } else {
            console.error(msg);
        }
    }

    /** DEBUG for detailed remote diagnostic data (not shown in production by default). */
    debug(operation: string, message: string, meta?: Meta): void {
        console.debug(buildMessage(this.module, operation, message, meta));
    }

    // ── Forge-only (LOCAL) logs ────────────────────────────────────────────
    // Use for operations that are ENTIRELY within the Forge runtime.
    // These are: KVS reads/writes, permission checks, local data validation,
    // and any resolver entry where no backend HTTP call is made.
    // Prefix [LOCAL] signals: "no corresponding entry in Spring Boot log file".

    /** INFO for Forge-internal events: KVS read/write, permission check, local processing. */
    localInfo(operation: string, message: string, meta?: Meta): void {
        console.log(buildMessage(this.module, operation, message, meta, true));
    }

    /** WARN for recoverable Forge-internal issues (missing KVS value, fallback used). */
    localWarn(operation: string, message: string, meta?: Meta): void {
        console.warn(buildMessage(this.module, operation, message, meta, true));
    }

    /** ERROR for Forge-internal failures (KVS error, permission denied, validation fail). */
    localError(operation: string, message: string, error?: unknown, meta?: Meta): void {
        const msg = buildMessage(this.module, operation, message, meta, true);
        if (error !== undefined) {
            console.error(msg, error);
        } else {
            console.error(msg);
        }
    }

    /** DEBUG for Forge-internal diagnostic detail. */
    localDebug(operation: string, message: string, meta?: Meta): void {
        console.debug(buildMessage(this.module, operation, message, meta, true));
    }
}
