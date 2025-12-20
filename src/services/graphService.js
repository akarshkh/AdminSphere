import { Client } from "@microsoft/microsoft-graph-client";

export class GraphService {
    constructor(accessToken) {
        this.client = Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            },
        });
    }

    async getUserDetails() {
        return await this.client.api("/me").get();
    }

    // Fetches users and their mailbox settings using the Beta endpoint
    async getExchangeMailboxReport() {
        try {
            // 1. Get List of Users with Beta properties
            // archiveStatus is often available directly on the User object in Beta
            const usersResponse = await this.client.api("/users")
                .version("beta")
                .select("id,displayName,userPrincipalName,mail,archiveStatus,assignedPlans")
                .top(25)
                .get();

            const users = usersResponse.value;

            // 2. Fetch Mailbox Settings/Details 
            const detailedReports = await Promise.all(users.map(async (user) => {
                let settings = {};
                try {
                    // Try to get mailbox settings for retention/auto-expand
                    settings = await this.client.api(`/users/${user.id}/mailboxSettings`).version("beta").get();
                } catch (err) {
                    console.log(`Could not fetch mailbox settings for ${user.userPrincipalName}`);
                }

                // Infer or read properties
                const isArchiveEnabled = user.archiveStatus === 'Active' || user.archiveStatus === 'Enabled';
                // Fallback to checking assignedPlans if archiveStatus is missing but they have Exchange
                const hasExchange = user.assignedPlans?.some(p => p.service === 'Exchange' && p.capabilityStatus === 'Enabled');

                return {
                    displayName: user.displayName,
                    emailAddress: user.mail || user.userPrincipalName,
                    archivePolicy: isArchiveEnabled,
                    // Retention/AutoExpanding are difficult to access via Graph without PowerShell. 
                    // We attempt to read them from settings or default to reasonable values.
                    retentionPolicy: settings.retentionPolicy || (hasExchange ? "Default MRT" : "None"),
                    autoExpanding: settings.autoExpandingArchiveEnabled === true
                };
            }));

            return detailedReports;
        } catch (error) {
            console.error("Graph API Error:", error);
            throw error;
        }
    }
}
