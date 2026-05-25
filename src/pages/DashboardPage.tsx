import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Xin chào, {user?.fullName ?? user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Đăng xuất
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Chào mừng đến với Noxh Admin Panel.
        </div>
      </div>
    </div>
  )
}
