const STATUS_STYLES: Record<string, React.CSSProperties> = {
    pending: { color: "var(--muted-foreground)", backgroundColor: "var(--secondary)" },
    active: { color: "oklch(0.7 0.17 150)", backgroundColor: "oklch(0.7 0.17 150 / 0.1)" },
    completed: { color: "var(--ring)", backgroundColor: "var(--muted)" },
    cancelled: { color: "var(--destructive)", backgroundColor: "oklch(0.6168 0.2086 25.8088 / 0.1)" },
};

const LABELS: Record<string, string> = {
    pending: "Draft",
    active: "Dispatched",
    completed: "Completed",
    cancelled: "Cancelled",
};

export default function TripStatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "var(--radius)",
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "capitalize",
            ...style,
        }}>
            {LABELS[status] ?? status}
        </span>
    );
}
