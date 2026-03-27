import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('kotsai@gmail.com');
  const [password, setPassword] = useState('kots@123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await apiClient.post('/api/auth/login', { email, password });
      localStorage.setItem('oav_token', data.access_token);
      localStorage.setItem('oav_workspace', data.workspace_id);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-oav-bg flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-oav-surface border border-oav-border rounded-xl p-8 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-oav-text">OpenAgentVisualizer</h1>
        {error && <p className="text-oav-error text-sm">{error}</p>}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-oav-muted mb-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-oav-muted mb-1">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-oav-accent text-white rounded-lg py-2 font-semibold hover:bg-blue-600"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
