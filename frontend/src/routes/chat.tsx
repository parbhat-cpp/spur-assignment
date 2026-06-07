import ChatsList from '#/components/ChatsList'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { IoIosMenu } from 'react-icons/io'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'

export const Route = createFileRoute('/chat')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate({ to: '/' })
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden md:block">
        <ChatsList />
      </div>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-5">
            <Drawer direction="left">
              <DrawerTrigger>
                <div className="block md:hidden">
                  <IoIosMenu size={24} />
                </div>
              </DrawerTrigger>
              <DrawerContent className="flex h-full w-full">
                <ChatsList />
              </DrawerContent>
            </Drawer>
            <p className="text-sm text-slate-500">Spur Customer Support</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 overflow-auto p-3 md:p-4">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
