import { ForgeLogger } from '../utils/logger.util';

const log = new ForgeLogger('LifecycleEvents');

/**
 * Runs before the app is uninstalled (preUninstall module).
 * Has a 55-second timeout for cleanup operations.
 */
export async function handlePreUninstall(payload: Record<string, unknown>, context: Record<string, unknown>) {
    const payloadContext = payload.context as { cloudId?: string; moduleKey?: string } | undefined;
    const cloudId = payloadContext?.cloudId;
    const ctx = context as { installContext?: string; accountId?: string };

    log.localInfo('handlePreUninstall', 'App pre-uninstall triggered', {
        cloudId,
        moduleKey: payloadContext?.moduleKey,
        installContext: ctx.installContext,
    });

}
