import { formatDistanceToNow } from "date-fns";

interface Trip {
    id: string;
    origin: string;
    destination: string;
    status: string;
    cargo_type: string | null;
    created_at: string;
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
    active: { color: "oklch(0.7 0.17 150)", backgroundColor: "oklch(0.7 0.17 150 / 0.1)" },
    pending: { color: "var(--muted-foreground)", backgroundColor: "var(--secondary)" },
    completed: { color: "var(--ring)", backgroundColor: "var(--muted)" },
    cancelled: { color: "var(--destructive)", backgroundColor: "oklch(0.6168 0.2086 25.8088 / 0.1)" },
};

export default function RecentTrips({ trips }: { trips: Trip[] }) {
    if (trips.length === 0) {
        return (
            <div style={s.empty}>
                No trips yet. Create your first trip in the Trips page.
            </div>
        );
    }

    return (
        <div style={s.tableWrap}>
            <table style={s.table}>
                <thead>
                    <tr>
                        {["Origin", "Destination", "Cargo", "Status", "Created"].map((h) => (
                            <th key={h} style={s.th}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {trips.map((t) => (
                        <tr key={t.id} style={s.tr}>
                            <td style={s.td}>{t.origin}</td>
                            <td style={s.td}>{t.destination}</td>
                            <td style={s.td}>{t.cargo_type ?? "—"}</td>
                            <td style={s.td}>
                                <span style={{ ...s.badge, ...STATUS_STYLE[t.status] }}>
                                    {t.status}
                                </span>
                            </td>
                            <td style={{ ...s.td, ...s.tdMuted }}>
                                {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    tableWrap: {
        overflowX: "auto",
        borderRadius: "var(--radius)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
    },
    th: {
        padding: "10px 14px",
        textAlign: "left",
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--muted-foreground)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--border)",
        backgroundColor: "var(--card)",
        whiteSpace: "nowrap",
    },
    tr: {
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--border)",
    },
    td: {
        padding: "11px 14px",
        color: "var(--foreground)",
        backgroundColor: "var(--card)",
    },
    tdMuted: {
        color: "var(--muted-foreground)",
        fontSize: "12px",
    },
    badge: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--radius)",
        fontSize: "11px",
        fontWeight: 500,
        textTransform: "capitalize",
    },
    empty: {
        padding: "40px 20px",
        textAlign: "center",
        fontSize: "13px",
        color: "var(--muted-foreground)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        backgroundColor: "var(--card)",
    },
};
