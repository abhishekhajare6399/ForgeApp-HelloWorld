import { ForgeLogger } from '../utils/logger.util';

const log = new ForgeLogger('LifecycleEvents');

/**
 * Runs when the app is upgraded to a new major version (avi:forge:upgraded:app).
 */
export async function handleUpgrade(event: Record<string, unknown>, context: Record<string, unknown>) {
    const app = event.app as { id?: string; version?: string; name?: string } | undefined;
    const environment = event.environment as { id?: string } | undefined;
    const cloudId = (context as { cloudId?: string }).cloudId;

    log.localInfo('handleUpgrade', 'App upgraded to new major version', {
        installationId: event.id as string,
        appVersion: app?.version,
        cloudId,
    });

}
