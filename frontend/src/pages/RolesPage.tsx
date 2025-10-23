import { useState, useEffect } from 'react';
import { roleService, Role } from '@/services/roles.service';
import { RoleForm } from '@/components/roles/RoleForm';
import { RoleList } from '@/components/roles/RoleList';

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Load roles on mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const data = await roleService.listRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async (data: any) => {
    setIsLoading(true);
    try {
      await roleService.createRole(data);
      await loadRoles();
      setShowForm(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (data: any) => {
    if (!selectedRole) return;
    setIsLoading(true);
    try {
      await roleService.updateRole(selectedRole.id, data);
      await loadRoles();
      setShowForm(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      setIsLoading(true);
      try {
        await roleService.deleteRole(role.id);
        await loadRoles();
        setSelectedRole(null);
      } catch (error) {
        console.error('Failed to delete role:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRole(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Roles & Permissions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list area */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Roles</h2>
            {!showForm && (
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + New Role
              </button>
            )}
          </div>
          <RoleList
            roles={roles}
            onSelect={setSelectedRole}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
            isLoading={isLoading}
          />
        </div>

        {/* Form area */}
        <div className="lg:col-span-1">
          {showForm ? (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">
                {selectedRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <RoleForm
                role={selectedRole || undefined}
                onSubmit={selectedRole ? handleUpdateRole : handleCreateRole}
                isLoading={isLoading}
              />
              <button
                onClick={handleCloseForm}
                className="w-full mt-4 px-4 py-2 text-gray-700 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : selectedRole ? (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Role Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg">{selectedRole.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{selectedRole.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${selectedRole.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {selectedRole.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleEditRole(selectedRole)}
                  className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Edit Role
                </button>
                <button
                  onClick={() => handleDeleteRole(selectedRole)}
                  className="w-full px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  Delete Role
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
