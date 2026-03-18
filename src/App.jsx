import Board from "./components/Board";

export default function App() {
    return (
        <div className="min-h-screen bg-(--color-bg) flex flex-col items-center py-8 gap-6">
            <h1 className="text-4xl font-bold text-(--color-title)">Donjon Fall</h1>
            <Board/>
        </div>
    );
}
