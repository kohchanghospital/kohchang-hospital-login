import Sidebar from "./Sidebar";

function Skeleton({ className = "" }: { className?: string }) {
    return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

type TableSkeletonProps = {
    columns?: number;
    rows?: number;
    filters?: number;
};

export function AdminShellSkeleton() {
    return (
        <div className="min-h-screen" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">กำลังโหลดระบบผู้ดูแล</span>
            <Sidebar />

            <main className="min-h-screen p-4 lg:ml-72 lg:p-8">
                <div className="mb-6 flex items-center justify-between rounded-3xl border border-white/70 bg-white/85 px-4 py-3 shadow-soft">
                    <div className="min-w-0 space-y-2"><Skeleton className="h-3 w-36" /><Skeleton className="h-5 w-48 max-w-full" /></div>
                    <Skeleton className="h-12 w-44 max-w-[45%] rounded-full" />
                </div>
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 shadow-lift sm:p-8">
                    <Skeleton className="h-4 w-36 !bg-white/15" />
                    <Skeleton className="mt-3 h-8 w-80 max-w-full !bg-white/20 sm:h-10" />
                    <Skeleton className="mt-3 h-4 w-full max-w-2xl !bg-white/15" />
                    <Skeleton className="mt-2 h-4 w-4/5 max-w-xl !bg-white/15" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="page-surface p-6">
                            <div className="mb-5 flex items-center justify-between"><Skeleton className="h-10 w-10 rounded-2xl" /><Skeleton className="h-2 w-14 rounded-full" /></div>
                            <Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-10 w-20" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export function TablePageSkeleton({
    columns = 5,
    rows = 6,
    filters = 2,
}: TableSkeletonProps) {
    return (
        <div className="page-surface page-pad" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">กำลังโหลดตารางข้อมูล</span>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-3 w-72 max-w-full" /></div>
                <Skeleton className="h-10 w-36" />
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row">
                    {Array.from({ length: filters }).map((_, index) => (
                        <Skeleton key={index} className={`h-10 ${index === 0 ? "w-full sm:w-44" : "w-full sm:w-64"}`} />
                    ))}
                </div>
                <Skeleton className="h-10 w-full sm:w-48" />
            </div>

            <TableRowsSkeleton columns={columns} rows={rows} />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-9 w-9" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function TableRowsSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
    return (
        <div className="table-wrap" role="status" aria-busy="true">
            <div className="min-w-[760px]" style={{ minWidth: columns >= 7 ? `${columns * 135}px` : undefined }}>
                <div className="grid gap-4 border-b bg-slate-50 px-3 py-3" style={{ gridTemplateColumns: columnTemplate(columns) }}>
                    {Array.from({ length: columns }).map((_, index) => <Skeleton key={index} className={`h-3 ${index === 1 ? "w-4/5" : "w-3/5"}`} />)}
                </div>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid min-h-14 items-center gap-4 border-b px-3 py-3 last:border-b-0" style={{ gridTemplateColumns: columnTemplate(columns) }}>
                        {Array.from({ length: columns }).map((_, columnIndex) => (
                            columnIndex === columns - 1 ? (
                                <div key={columnIndex} className="flex justify-center gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div>
                            ) : <Skeleton key={columnIndex} className={`h-4 ${columnIndex === 1 ? (rowIndex % 2 ? "w-3/4" : "w-full") : "w-2/3"}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function columnTemplate(columns: number) {
    if (columns >= 8) return `4rem 7rem 7rem minmax(13rem, 1.5fr) repeat(${columns - 6}, minmax(8rem, 1fr)) 7rem`;
    if (columns === 7) return "4rem 7rem 7rem minmax(14rem, 1.5fr) 6rem minmax(10rem, 1fr) 7rem";
    return `4rem minmax(14rem, 2fr) repeat(${Math.max(columns - 3, 1)}, minmax(8rem, 1fr)) 7rem`;
}

export function EditorPageSkeleton({ sections = 2, variant = "editor" }: { sections?: number; variant?: "editor" | "form" | "settings" }) {
    if (variant === "settings") return <SettingsPageSkeleton />;
    if (variant === "form") return <FormPageSkeleton sections={sections} />;

    return (
        <div className="page-surface page-pad" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">กำลังโหลดแบบฟอร์มเนื้อหา</span>
            <Skeleton className="h-8 w-80 max-w-full" />

            <div className="mx-auto max-w-5xl">
                {Array.from({ length: sections }).map((_, index) => (
                    <div key={index} className="mt-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <Skeleton className="mb-3 h-6 w-56 max-w-full" />
                        <Skeleton className="h-12 rounded-b-none border border-slate-100 bg-slate-100" />
                        <Skeleton className="h-[300px] rounded-t-none border border-t-0 border-slate-100 bg-slate-50" />
                    </div>
                ))}

                <div className="flex justify-center">
                    <Skeleton className="mt-8 h-10 w-24" />
                </div>
            </div>
        </div>
    );
}

function FormPageSkeleton({ sections }: { sections: number }) {
    return (
        <div className="page-surface page-pad" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">กำลังโหลดข้อมูลแบบฟอร์ม</span>
            <Skeleton className="h-8 w-72 max-w-full" />
            <div className="mx-auto mt-6 max-w-5xl space-y-6">
                {Array.from({ length: sections }).map((_, index) => (
                    <section key={index} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                        <Skeleton className="mb-4 h-6 w-56 max-w-full" />
                        <div className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: index === 1 ? 3 : 4 }).map((_, fieldIndex) => (
                                <div key={fieldIndex} className={fieldIndex === 2 ? "md:col-span-2" : ""}><Skeleton className="mb-2 h-4 w-24" /><Skeleton className={`${fieldIndex === 2 ? "h-24" : "h-10"} w-full`} /></div>
                            ))}
                        </div>
                    </section>
                ))}
                <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
            </div>
        </div>
    );
}

function SettingsPageSkeleton() {
    return (
        <div className="space-y-5" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">กำลังโหลดการตั้งค่า</span>
            <header className="page-surface page-pad"><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-8 w-36" /><Skeleton className="mt-3 h-4 w-96 max-w-full" /><div className="mt-6 flex gap-2"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-40" /></div></header>
            <section className="page-surface page-pad"><Skeleton className="h-6 w-56" /><Skeleton className="mt-2 h-4 w-96 max-w-full" /><div className="mt-5 grid gap-4 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex justify-between"><Skeleton className="h-11 w-11 rounded-xl" /><Skeleton className="h-7 w-24 rounded-full" /></div><Skeleton className="mt-4 h-6 w-4/5" /><Skeleton className="mt-2 h-3 w-32" /><div className="mt-5 border-t pt-4"><Skeleton className="h-4 w-full" /><Skeleton className="mt-3 h-4 w-4/5" /></div><div className="mt-5 flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div></div>)}</div></section>
        </div>
    );
}

export function ManagementPageSkeleton() {
    const skeletonRows = Array.from({ length: 5 });

    return (
        <div className="animate-pulse">
            <div className="h-8 w-56 rounded bg-gray-200 mb-4" />

            <div className="page-surface mb-6 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <div>
                    <div className="h-5 w-20 rounded bg-gray-200 mb-2" />
                    <div className="h-10 rounded bg-gray-100 border border-gray-100" />
                </div>
                <div>
                    <div className="h-5 w-28 rounded bg-gray-200 mb-2" />
                    <div className="h-10 rounded bg-gray-100 border border-gray-100" />
                </div>
                <div>
                    <div className="h-5 w-24 rounded bg-gray-200 mb-2" />
                    <div className="h-10 rounded bg-gray-100 border border-gray-100" />
                </div>
                <div className="flex items-center gap-3 pt-7 pl-3">
                    <div className="h-4 w-4 rounded bg-gray-200" />
                    <div className="h-5 w-24 rounded bg-gray-200" />
                </div>
                <div>
                    <div className="h-5 w-24 rounded bg-gray-200 mb-2" />
                    <div className="h-10 w-48 rounded bg-gray-100 border border-gray-100" />
                </div>
                <div className="h-40 w-32 rounded bg-gray-100" />
                <div className="col-span-2 h-10 w-24 rounded bg-gray-200" />
            </div>

            <div className="page-surface p-4">
                <div className="grid grid-cols-[10rem_1fr_1fr_1fr_6rem_6rem] gap-4 border-b pb-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-5 rounded bg-gray-200" />
                    ))}
                </div>

                <div className="mt-3 space-y-3">
                    <div className="h-9 rounded bg-gray-100" />
                    {skeletonRows.map((_, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-[10rem_1fr_1fr_1fr_6rem_6rem] gap-4 items-center border-b pb-3"
                        >
                            <div className="mx-auto h-20 w-16 rounded bg-gray-100" />
                            <div className="h-5 rounded bg-gray-100" />
                            <div className="h-5 rounded bg-gray-100" />
                            <div className="h-5 rounded bg-gray-100" />
                            <div className="h-5 rounded bg-gray-100" />
                            <div className="h-6 rounded bg-gray-100" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
