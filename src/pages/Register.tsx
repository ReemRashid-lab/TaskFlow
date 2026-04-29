import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Briefcase } from 'lucide-react';

export default function Register() {
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(staffId, name, password, email || undefined);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-colors">
        <div className="p-6 text-center border-b border-border">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Create Account</h2>
          <p className="text-sm text-muted-foreground mt-1">Join TaskFlow to start managing tasks</p>
        </div>
        <form onSubmit={handleRegister} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-[#fee2e2] p-3 text-sm text-[#b91c1c] border border-[#fca5a5]">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="staffId" className="text-[0.825rem] font-bold text-[#1e293b]">Staff ID (Login Username)</Label>
            <Input 
              id="staffId" 
              type="text"
              placeholder="e.g. EMP_001" 
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required 
              className="border-[#e2e8f0] focus:ring-[#3b82f6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-[0.825rem] font-bold text-[#1e293b]">Full Name</Label>
            <Input 
              id="name" 
              type="text"
              placeholder="e.g. John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="border-[#e2e8f0] focus:ring-[#3b82f6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[0.825rem] font-bold text-[#1e293b]">Work Email (Optional)</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-[#e2e8f0] focus:ring-[#3b82f6]"
            />
            <p className="text-[0.65rem] text-[#64748b]">If left blank, an internal email will be generated.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[0.825rem] font-bold text-[#1e293b]">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="border-[#e2e8f0] focus:ring-[#3b82f6]"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-md transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <div className="text-center mt-4 text-sm text-[#64748b]">
            Already have an account? <Link to="/login" className="text-[#3b82f6] hover:underline font-semibold">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
