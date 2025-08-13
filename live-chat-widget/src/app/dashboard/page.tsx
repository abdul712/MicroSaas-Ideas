import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ConversationList } from '@/components/dashboard/conversation-list'
import { ChatPanel } from '@/components/dashboard/chat-panel'
import { AgentStatus } from '@/components/dashboard/agent-status'
import { QuickStats } from '@/components/dashboard/quick-stats'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Agent Status */}
          <div className="p-4 border-b">
            <AgentStatus />
          </div>
          
          {/* Quick Stats */}
          <div className="p-4 border-b">
            <QuickStats />
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>
        </div>

        {/* Main Chat Panel */}
        <div className="flex-1 flex flex-col">
          <ChatPanel />
        </div>
      </div>
    </DashboardLayout>
  )
}