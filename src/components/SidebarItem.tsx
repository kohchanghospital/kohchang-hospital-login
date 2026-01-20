type Props = {
    label: string;
    icon: string;
    active: boolean;
    onClick: () => void;
};

export default function SidebarItem({
    label,
    icon,
    active,
    onClick,
}: Props) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${active
                    ? "bg-primary-600 text-white"
                    : "text-primary-100 hover:bg-primary-600 hover:text-white"
                }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );
}
