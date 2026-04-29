import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Briefcase } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">TaskFlow Pro</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in with your username or email</p>
        </div>
        <form onSubmit={handleEmailLogin} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-[#fee2e2] p-3 text-sm text-[#b91c1c] border border-[#fca5a5]">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-[0.825rem] font-bold text-[#1e293b]">Username or Email</Label>
            <Input 
              id="identifier" 
              type="text"
              placeholder="Staff ID or email@company.com" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required 
              className="border-[#e2e8f0] focus:ring-[#3b82f6]"
            />
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center mt-4 text-sm text-[#64748b]">
            First time logging in? <Link to="/register" className="text-[#3b82f6] hover:underline font-semibold">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
