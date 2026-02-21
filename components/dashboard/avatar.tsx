function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

interface Props {
    fullName: string;
    avatarUrl: string | null;
    size?: number;
    fontSize?: number;
}

export default function Avatar({ fullName, avatarUrl, size = 30, fontSize = 11 }: Props) {
    const base: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={fullName}
                referrerPolicy="no-referrer"
                style={{ ...base, objectFit: "cover" }}
            />
        );
    }

    return (
        <div style={{
            ...base,
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize,
            fontWeight: 700,
        }}>
            {initials(fullName)}
        </div>
    );
}
