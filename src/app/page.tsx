import HealthFoodScanner from "./components/HealthFoodScanner";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Health Food Scanner</h1>
      <HealthFoodScanner />
    </main>
  );
}
