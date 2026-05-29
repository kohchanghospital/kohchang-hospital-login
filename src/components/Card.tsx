type Props = {
    title: string;
    value: string;
};

export default function Card({ title, value }: Props) {
    return (
        <div className="group page-surface p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <div className="mb-5 flex items-center justify-between">
                <div className="h-10 w-10 rounded-2xl bg-primary-100 transition group-hover:bg-primary-600" />
                <div className="h-2 w-14 rounded-full bg-accent-500/70" />
            </div>
            <div className="text-sm font-semibold text-slate-500">
                {title}
            </div>
            <div className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {value}
            </div>
        </div>
    );
}
