type Props = {
    title: string;
    value: string;
};

export default function Card({ title, value }: Props) {
    return (
        <div className="bg-white rounded-xl shadow p-6">
            <div className="text-gray-500 text-sm">
                {title}
            </div>
            <div className="text-3xl font-bold text-primary-600">
                {value}
            </div>
        </div>
    );
}
