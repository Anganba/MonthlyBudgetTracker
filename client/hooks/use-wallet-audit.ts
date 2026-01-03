import { useQuery } from "@tanstack/react-query";
import { AuditLog, AuditEntityType } from "@shared/api";

interface UseAuditOptions {
    entityType?: AuditEntityType;
    entityId?: string;
    limit?: number;
    offset?: number;
}

export function useAudit(options: UseAuditOptions = {}) {
    const { entityType, entityId, limit = 50, offset = 0 } = options;

    const { data: auditLogs = [], isLoading, refetch } = useQuery<AuditLog[]>({
        queryKey: ["auditLogs", entityType, entityId, limit, offset],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
            });

            if (entityType) {
                params.append("entityType", entityType);
            }
            if (entityId) {
                params.append("entityId", entityId);
            }

            const res = await fetch(`/api/audit-logs?${params}`);
            if (!res.ok) throw new Error("Failed to fetch audit logs");
            const json = await res.json();
            return json.data || [];
        },
    });

    return {
        auditLogs,
        isLoading,
        refetch
    };
}

// Keep backward compatibility alias
export const useWalletAudit = useAudit;

