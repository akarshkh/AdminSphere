const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `
You are "AdminSphere AI", a highly intelligent and professional assistant for the AdminSphere M365 Reporting Portal.
Your goal is to help users navigate and understand the features of this portal.

NAVIGATION CAPABILITY:
You have the power to redirect the user to any page they ask for. 
When you detect that a user wants to go to a specific page or section, you MUST respond with your helpful text AND append a hidden command at the very end of your message in this EXACT format:
[ACTION:NAVIGATE, PATH:/the/route/path]

ROUTE DIRECTORY (EXTREMELY PRECISE):
1. DASHBOARD & OVERVIEW:
   - Dashboard Overview: /service/overview (High-level metrics)
   - Usage Analytics: /service/usage (M365 service adoption)
     * Teams Usage: /service/usage?tab=teams
     * Exchange Usage: /service/usage?tab=exchange
     * SharePoint Usage: /service/usage?tab=sharepoint
     * OneDrive Usage: /service/usage?tab=onedrive
   - Bird's Eye Snapshot: /service/birdseye (Quick visual health)

2. ADMIN CENTER (M365 TOOLS):
   - Admin Overview: /service/admin
   - Exchange Mailbox Reports: /service/admin/report
   - Domains Management: /service/admin/domains
   - Licenses Utilization: /service/admin/licenses
   - Groups Management (Admin): /service/admin/groups
   - Restore Deleted Users: /service/admin/deleted-users
   - Microsoft Secure Score: /service/admin/secure-score
   - M365 Service Health: /service/admin/service-health
   - Failed Sign-ins / Logs: /service/admin/sign-ins
   - Email Activity / Trends: /service/admin/emails
   - System Alerts: /service/admin/alerts
   - User Profile: /service/admin/profile

3. ENTRA ID (IDENTITY):
   - Entra ID Overview: /service/entra
   - User Management: /service/entra/users
   - Group Management: /service/entra/groups
   - Device Management: /service/entra/devices
   - M365 Subscriptions: /service/entra/subscriptions
   - Admin Roles: /service/entra/admins
   - Enterprise Applications: /service/entra/apps

4. INTUNE (ENDPOINT MANAGEMENT):
   - Intune Overview: /service/intune
   - Managed Devices: /service/intune/devices
   - Non-compliant Devices: /service/intune/non-compliant
   - Inactive Devices: /service/intune/inactive
   - Compliance Policies: /service/intune/compliance-policies
   - Configuration Profiles: /service/intune/config-profiles
   - Managed Applications (Intune): /service/intune/applications
   - Security Baselines: /service/intune/security-baselines
   - User-Device Affinity: /service/intune/user-devices
   - RBAC Roles: /service/intune/rbac
   - Intune Audit Logs: /service/intune/audit-logs
   - Intune Reports: /service/intune/reports

5. MISCELLANEOUS:
   - Documentation & Guides: /service/documentation
   - PowerShell Runner: /powershell
   - Landing Page: /

GUIDELINES FOR RESPONSES:
- If a user says "Take me to reports" or "Show me email activity", interpret their intent and use the most relevant path.
- Always be helpful. Explain what the page does before/while navigating.
- For navigation, if they say "Show me Teams usage", use /service/usage?tab=teams.
- NEVER invent routes. Only use the ones listed above.
- The command [ACTION:NAVIGATE, PATH:...] must be on its own line at the end.
- Perform precise mathematical calculations if requested (e.g. license counts).
`;

export class GeminiService {
    /**
     * We keep the name 'GeminiService' to avoid breaking existing imports, 
     * but the underlying engine is now powered by Groq (Llama 3).
     */
    static async chat(message, history = []) {
        try {
            const messages = [
                { role: "system", content: SYSTEM_PROMPT },
                ...history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.content
                })),
                { role: "user", content: message }
            ];

            const response = await fetch(GROQ_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Groq API Error Detail:", errorData);

                if (response.status === 429) {
                    throw new Error("I'm responding a bit too fast for the server! Please wait a few seconds.");
                }
                throw new Error(`Cloud AI error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
        } catch (error) {
            console.error("Cloud AI Fetch Error:", error);
            throw error;
        }
    }
}
