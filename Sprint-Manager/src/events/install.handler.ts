import { ForgeLogger } from '../utils/logger.util';

const log = new ForgeLogger('LifecycleEvents');

/**
 * Runs when the app is installed on a site (avi:forge:installed:app).
 */
export async function handleInstall(event: Record<string, unknown>, context: Record<string, unknown>) {
    const app = event.app as { id?: string; version?: string; name?: string } | undefined;
    const environment = event.environment as { id?: string } | undefined;
    const cloudId = (context as { cloudId?: string }).cloudId;

    log.localInfo('handleInstall', 'App installed', {
        installationId: event.id as string,
        appVersion: app?.version,
        cloudId,
    });


}
