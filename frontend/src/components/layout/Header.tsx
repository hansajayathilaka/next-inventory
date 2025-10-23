import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/authContext';

export function Header() {
  const { authState, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Hardware Store POS</h1>
        </div>

        <div className="flex items-center space-x-4">
          {authState.isAuthenticated && (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {authState.user?.first_name} {authState.user?.last_name || authState.user?.username}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}