"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LogOut,
  Users,
  Loader2,
  Shield,
  Edit,
  Plus,
  X,
  Save,
} from "lucide-react";
import { User, UserRole } from "@repo/types";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>(UserRole.VIEWER);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: UserRole.VIEWER,
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResponse = await authClient.getSession();

        if (!sessionResponse?.data?.user) {
          router.push("/");
          return;
        }

        const userResponse = await fetch("/api/user");
        if (!userResponse.ok) {
          router.push("/");
          return;
        }

        const { user: userData } = await userResponse.json();

        const userDb: User = {
          id: userData.id,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email,
          image: userData.image,
          emailVerified: userData.emailVerified,
          role: (userData.role as UserRole) || UserRole.VIEWER,
          createdAt: userData.createdAt
            ? new Date(userData.createdAt)
            : undefined,
          updatedAt: userData.updatedAt
            ? new Date(userData.updatedAt)
            : undefined,
        };

        if (userDb.role !== UserRole.ADMIN) {
          router.push("/home");
          return;
        }

        setUser(userDb);
        await fetchUsers();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const { users: usersData } = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleEditRole = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });

      if (response.ok) {
        const { user: updatedUser } = await response.json();
        setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        setEditingUserId(null);
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const { user: addedUser } = await response.json();
        setUsers([addedUser, ...users]);
        setNewUser({
          email: "",
          firstName: "",
          lastName: "",
          role: UserRole.VIEWER,
        });
        setShowAddUser(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add user");
      }
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-700";
      case UserRole.EDITOR:
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/home")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              Back to Home
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>

        {showAddUser && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New User
              </h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
                >
                  <option value={UserRole.VIEWER}>Viewer</option>
                  <option value={UserRole.EDITOR}>Editor</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddUser}
                className="flex items-center space-x-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800"
              >
                <Save className="h-4 w-4" />
                <span>Save User</span>
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
          </div>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {u.image ? (
                            <img
                              src={u.image}
                              alt={`${u.firstName} ${u.lastName}`}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {u.firstName} {u.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === u.id ? (
                          <select
                            value={editRole}
                            onChange={(e) =>
                              setEditRole(e.target.value as UserRole)
                            }
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
                          >
                            <option value={UserRole.VIEWER}>Viewer</option>
                            <option value={UserRole.EDITOR}>Editor</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {editingUserId === u.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditRole(u.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditRole(u.role);
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
