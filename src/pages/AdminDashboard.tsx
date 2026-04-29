import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ staffId: '', name: '', email: '', password: '', role: 'Staff' });

  const loadUsers = async () => {
    try {
      const data = await fetchApi('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      setIsAddUserOpen(false);
      setNewUser({ staffId: '', name: '', email: '', password: '', role: 'Staff' });
      loadUsers();
    } catch (err: any) {
      alert(`Failed to add user: ${err.message || 'Unknown error'}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
    } catch (err: any) {
      alert(`Failed to update role: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetchApi(`/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (err: any) {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div>Loading...</div>;

  const admins = users.filter(u => u.role === 'Admin').length;
  const managers = users.filter(u => u.role === 'Manager').length;
  const staff = users.filter(u => u.role === 'Staff').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Admin Dashboard</h1>
        <p className="text-[#64748b] mt-1 text-sm">Manage system users and roles.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] font-bold text-[#64748b] uppercase tracking-wider">Total Staff</span>
            <Users className="h-4 w-4 text-[#94a3b8]" />
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{staff}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] font-bold text-[#64748b] uppercase tracking-wider">Total Managers</span>
            <CheckCircle2 className="h-4 w-4 text-[#94a3b8]" />
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{managers}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] font-bold text-[#64748b] uppercase tracking-wider">System Admins</span>
            <ShieldAlert className="h-4 w-4 text-[#94a3b8]" />
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{admins}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="font-bold text-base text-[#1e293b]">User Management</div>
          <button onClick={() => setIsAddUserOpen(true)} className="w-full sm:w-auto px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-md transition-colors flex justify-center items-center">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#f8fafc] px-6 py-3 text-[0.7rem] uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] font-semibold">Staff ID</th>
                <th className="bg-[#f8fafc] px-6 py-3 text-[0.7rem] uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] font-semibold">Name</th>
                <th className="bg-[#f8fafc] px-6 py-3 text-[0.7rem] uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] font-semibold">Role</th>
                <th className="bg-[#f8fafc] px-6 py-3 text-[0.7rem] uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-3.5 text-[0.75rem] font-mono text-[#64748b] border-b border-[#e2e8f0]">{user.staffId}</td>
                  <td className="px-6 py-3.5 text-[0.825rem] text-[#1e293b] border-b border-[#e2e8f0] font-medium">{user.name}</td>
                  <td className="px-6 py-3.5 border-b border-[#e2e8f0]">
                    <Select defaultValue={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                      <SelectTrigger className="w-[120px] h-8 text-[0.75rem]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-3.5 border-b border-[#e2e8f0] text-right">
                    <button 
                      className="text-[#ef4444] hover:underline font-semibold text-[0.75rem]"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-[#64748b] text-sm">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staffId">Staff ID</Label>
              <Input id="staffId" value={newUser.staffId} onChange={e => setNewUser({...newUser, staffId: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <button type="button" className="w-full sm:w-auto px-4 py-2 bg-card border-border text-foreground transition-colors text-sm font-semibold rounded-md hover:bg-[#f1f5f9] transition-colors" onClick={() => setIsAddUserOpen(false)}>Cancel</button>
              <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-md transition-colors">Create User</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
