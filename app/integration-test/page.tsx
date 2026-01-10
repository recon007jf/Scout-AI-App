import { IntegrationTestPanel } from "@/components/integration-test-panel"

export default function IntegrationTestPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Scout Integration Testing</h1>
        <p className="text-gray-400 mb-8">Server-Side Proxy Pattern: Browser → Next.js → Cloud Run</p>

        <IntegrationTestPanel />
      </div>
    </div>
  )
}
