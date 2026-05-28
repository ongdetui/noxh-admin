import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart2, BrainCircuit, Building2, LogOut, Newspaper } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 h-14 flex items-center border-b border-border">
          <span className="font-semibold text-foreground tracking-tight">Noxh Admin</span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          <NavLink
            to="/dashboard/projects"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Building2 className="size-4 shrink-0" />
            Dự án
          </NavLink>
          <NavLink
            to="/dashboard/news"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Newspaper className="size-4 shrink-0" />
            Tin tức
          </NavLink>
          <NavLink
            to="/dashboard/ai-analytics"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <BrainCircuit className="size-4 shrink-0" />
            AI Analytics
          </NavLink>
          <NavLink
            to="/dashboard/document-analytics"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <BarChart2 className="size-4 shrink-0" />
            Document Analytics
          </NavLink>
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground px-2 truncate">
            {user?.fullName ?? user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
