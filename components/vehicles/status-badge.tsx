const STATUS_STYLES: Record<string, React.CSSProperties> = {
    active: { color: "oklch(0.7 0.17 150)", backgroundColor: "oklch(0.7 0.17 150 / 0.12)" },
    idle: { color: "var(--muted-foreground)", backgroundColor: "var(--secondary)" },
    maintenance: { color: "oklch(0.75 0.18 60)", backgroundColor: "oklch(0.75 0.18 60 / 0.12)" },
    retired: { color: "var(--destructive)", backgroundColor: "oklch(0.6168 0.2086 25.8 / 0.1)" },
};

const LABELS: Record<string, string> = {
    active: "Active",
    idle: "Idle",
    maintenance: "Maintenance",
    retired: "Retired",
};

export default function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.idle;
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 9px",
            borderRadius: "var(--radius)",
            fontSize: "11px",
            fontWeight: 500,
            ...style,
        }}>
            {LABELS[status] ?? status}
        </span>
    );
}
