import api, { route } from '@forge/api';
import { ForgeLogger } from './logger.util';

const log = new ForgeLogger('JiraUser');

export interface JiraUserInfo {
    accountId: string;
    displayName?: string;
    emailAddress?: string;
}

/**
 * Fetches Jira user profile for lifecycle notifications.
 * Requires read:jira-user and read:email-address:jira scopes.
 */
export async function getJiraUser(accountId: string): Promise<JiraUserInfo | null> {
    if (!accountId) {
        return null;
    }

    try {
        const response = await api.asApp().requestJira(
            route`/rest/api/3/user?accountId=${accountId}`
        );

        if (!response.ok) {
            log.localWarn('getJiraUser', 'Jira user lookup failed', {
                accountId,
                status: response.status,
            });
            return null;
        }

        const user = (await response.json()) as {
            accountId?: string;
            displayName?: string;
            emailAddress?: string;
        };

        return {
            accountId: user.accountId || accountId,
            displayName: user.displayName,
            emailAddress: user.emailAddress,
        };
    } catch (error) {
        log.localError('getJiraUser', 'Error fetching Jira user', error, { accountId });
        return null;
    }
}
