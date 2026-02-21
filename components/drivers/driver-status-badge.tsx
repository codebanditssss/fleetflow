const STATUS_STYLES: Record<string, React.CSSProperties> = {
    active: { color: "oklch(0.7 0.17 150)", backgroundColor: "oklch(0.7 0.17 150 / 0.12)" },
    inactive: { color: "var(--muted-foreground)", backgroundColor: "var(--secondary)" },
    suspended: { color: "var(--destructive)", backgroundColor: "oklch(0.6168 0.2086 25.8 / 0.1)" },
};

const LABELS: Record<string, string> = {
    active: "On Duty",
    inactive: "Off Duty",
    suspended: "Suspended",
};

export default function DriverStatusBadge({ status }: { status: string }) {
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 9px",
            borderRadius: "var(--radius)",
            fontSize: "11px",
            fontWeight: 500,
            ...(STATUS_STYLES[status] ?? STATUS_STYLES.inactive),
        }}>
            {LABELS[status] ?? status}
        </span>
    );
}
