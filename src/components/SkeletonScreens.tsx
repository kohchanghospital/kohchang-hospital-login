import Sidebar from "./Sidebar";

type TableSkeletonProps = {
    columns?: number;
    rows?: number;
    filters?: number;
};

export function AdminShellSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <main className="ml-64 min-h-screen p-8">
                <div className="flex justify-between items-center mb-6 animate-pulse">
                    <div className="h-8 w-48 rounded bg-gray-200" />
                    <div className="h-12 w-44 rounded-full bg-gray-200" />
                </div>

                <TablePageSkeleton />
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
        <div className="bg-white rounded-xl shadow p-6 animate-pulse">
            <div className="flex justify-between mb-4">
                <div className="h-7 w-48 rounded bg-gray-200" />
                <div className="h-10 w-36 rounded-lg bg-gray-200" />
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    {Array.from({ length: filters }).map((_, index) => (
                        <div key={index} className="h-10 w-40 rounded-lg bg-gray-100" />
                    ))}
                </div>
                <div className="h-10 w-44 rounded-lg bg-gray-100" />
            </div>

            <TableRowsSkeleton columns={columns} rows={rows} />

            <div className="flex justify-between items-center mt-4">
                <div className="h-5 w-32 rounded bg-gray-100" />
                <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-8 w-9 rounded bg-gray-100" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function TableRowsSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
    return (
        <div className="animate-pulse">
            <div
                className="grid gap-4 border-b pb-3"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: columns }).map((_, index) => (
                    <div key={index} className="h-5 rounded bg-gray-200" />
                ))}
            </div>

            <div className="space-y-3 pt-3">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid gap-4 border-b pb-3"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: columns }).map((_, columnIndex) => (
                            <div key={columnIndex} className="h-5 rounded bg-gray-100" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function EditorPageSkeleton({ sections = 2 }: { sections?: number }) {
    return (
        <div className="bg-white rounded-xl shadow p-6 animate-pulse">
            <div className="h-8 w-80 rounded bg-gray-200" />

            <div className="mx-auto max-w-5xl">
                {Array.from({ length: sections }).map((_, index) => (
                    <div key={index} className="mt-8">
                        <div className="h-7 w-56 rounded bg-gray-200 mb-3" />
                        <div className="h-12 rounded-t bg-gray-100 border border-gray-100" />
                        <div className="h-64 rounded-b bg-gray-50 border border-t-0 border-gray-100" />
                    </div>
                ))}

                <div className="flex justify-center">
                    <div className="mt-8 h-10 w-24 rounded bg-gray-200" />
                </div>
            </div>
        </div>
    );
}

export function ManagementPageSkeleton() {
    const skeletonRows = Array.from({ length: 5 });

    return (
        <div className="p-6 animate-pulse">
            <div className="h-8 w-56 rounded bg-gray-200 mb-4" />

            <div className="bg-white p-6 rounded-2xl shadow mb-6 grid grid-cols-2 gap-4">
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

            <div className="bg-white rounded-2xl shadow p-4">
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
