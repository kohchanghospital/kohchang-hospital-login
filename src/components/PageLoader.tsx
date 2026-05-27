type Props = {
    message?: string;
};

export default function PageLoader({ message = "Loading..." }: Props) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin" />
                <div className="text-sm font-medium">{message}</div>
            </div>
        </div>
    );
}
