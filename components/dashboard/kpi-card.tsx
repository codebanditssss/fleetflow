interface Props {
    label: string;
    value: number | string;
    sub?: string;
    accent?: boolean;
}

export default function KpiCard({ label, value, sub, accent }: Props) {
    return (
        <div style={{
            ...s.card,
            ...(accent ? s.cardAccent : {}),
        }}>
            <span style={s.label}>{label}</span>
            <span style={{
                ...s.value,
                ...(accent ? s.valueAccent : {}),
            }}>{value}</span>
            {sub && <span style={s.sub}>{sub}</span>}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    card: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "20px",
        backgroundColor: "var(--card)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        flex: 1,
    },
    cardAccent: {
        borderColor: "var(--ring)",
    },
    label: {
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--muted-foreground)",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
    },
    value: {
        fontSize: "28px",
        fontWeight: 700,
        color: "var(--foreground)",
        lineHeight: 1,
    },
    valueAccent: {
        color: "var(--ring)",
    },
    sub: {
        fontSize: "11px",
        color: "var(--muted-foreground)",
        marginTop: "2px",
    },
};
