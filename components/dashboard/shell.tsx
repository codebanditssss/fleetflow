import Sidebar from "./sidebar";
import Topbar from "./topbar";

interface Props {
    fullName: string;
    role: string;
    avatarUrl: string | null;
    children: React.ReactNode;
}

export default function Shell({ fullName, role, avatarUrl, children }: Props) {
    return (
        <div style={s.root}>
            <Sidebar fullName={fullName} role={role} avatarUrl={avatarUrl} />
            <div style={s.right}>
                <Topbar fullName={fullName} role={role} avatarUrl={avatarUrl} />
                <main style={s.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    root: {
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--background)",
    },
    right: {
        marginLeft: "220px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
    },
    main: {
        marginTop: "56px",
        flex: 1,
        padding: "24px",
        overflowY: "auto",
    },
};
