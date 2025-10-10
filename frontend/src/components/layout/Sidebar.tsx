import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  permission?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'POS', href: '/pos', permission: 'create_sale' },
  { name: 'Roles', href: '/roles', permission: 'manage_roles' },
  { name: 'Staff', href: '/staff', permission: 'manage_staff' },
  { name: 'Customers', href: '/customers', permission: 'manage_customers' },
  { name: 'Suppliers', href: '/suppliers', permission: 'manage_suppliers' },
  { name: 'Categories', href: '/categories', permission: 'manage_categories' },
  { name: 'Products', href: '/products', permission: 'manage_products' },
  { name: 'Inventory', href: '/inventory', permission: 'manage_inventory' },
  { name: 'Purchases', href: '/purchases', permission: 'manage_purchases' },
  { name: 'Credits', href: '/credits', permission: 'manage_credits' },
  { name: 'Returns', href: '/returns', permission: 'process_returns' },
];

export function Sidebar() {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className="w-64 border-r bg-background">
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
              location.pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}