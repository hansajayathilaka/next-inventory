import { Role } from '@/services/roles.service';

interface RoleListProps {
  roles: Role[];
  onSelect?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  isLoading?: boolean;
}

export function RoleList({ roles, onSelect, onEdit, onDelete, isLoading = false }: RoleListProps) {
  if (isLoading) {
    return <div className="text-center py-4">Loading roles...</div>;
  }

  if (roles.length === 0) {
    return <div className="text-center py-4 text-gray-500">No roles found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left">Name</th>
            <th className="border px-4 py-2 text-left">Description</th>
            <th className="border px-4 py-2 text-left">Status</th>
            <th className="border px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr
              key={role.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect?.(role)}
            >
              <td className="border px-4 py-2 font-medium">{role.name}</td>
              <td className="border px-4 py-2">{role.description || '-'}</td>
              <td className="border px-4 py-2">
                <span className={`px-2 py-1 rounded text-sm ${role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="border px-4 py-2 text-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(role);
                  }}
                  className="px-2 py-1 text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(role);
                  }}
                  className="px-2 py-1 text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
