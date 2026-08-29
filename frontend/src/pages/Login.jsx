import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'inspector' });

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(loginForm.email, loginForm.password);
      localStorage.setItem('token', res.data.access_token);
      // Decode name from token
      const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
      localStorage.setItem('name', payload.name || 'User');
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(registerForm);
      setSuccess('Account created! You can now log in.');
      setTab('login');
      setLoginForm({ email: registerForm.email, password: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F4E79' }}>
            Road<span style={{ color: '#2E75B6' }}>tection</span>
          </h1>
          <p style={{ color: '#718096', fontSize: 14, marginTop: 4 }}>
            AI-powered road damage detection
          </p>
        </div>

        <div style={{ display: 'flex', marginBottom: 24, background: '#f0f4f8', borderRadius: 8, padding: 4 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              style={{ flex: 1, padding: '8px', borderRadius: 6, fontWeight: 500, fontSize: 14,
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#1F4E79' : '#718096',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {error   && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="you@example.com" required
                value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="••••••••" required
                value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8, padding: '12px', fontSize: 15 }} disabled={loading}>
              {loading ? <><span className="spinner"></span>Signing in...</> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input type="text" placeholder="Ronit Joshi" required
                value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="you@example.com" required
                value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="••••••••" required minLength={6}
                value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4a5568', display: 'block', marginBottom: 6 }}>Role</label>
              <select value={registerForm.role} onChange={e => setRegisterForm({...registerForm, role: e.target.value})}>
                <option value="inspector">Inspector</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8, padding: '12px', fontSize: 15 }} disabled={loading}>
              {loading ? <><span className="spinner"></span>Creating account...</> : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
