import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const LOGO_URL = "/abc.png"; // Replace with your logo path or omit

const Login = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    setError('');
    
    const endpoint = isRegister ? 'http://127.0.0.1:8000/register' : 'http://127.0.0.1:8000/login';
    
    try {
      const res = await axios.post(endpoint, { username, password });
      
      if (res.data.status === 'success') {
        const user = res.data.user;
        localStorage.setItem('dnu_user', JSON.stringify(user));
        onLoginSuccess(user);
      } else {
        setError(res.data.message || 'Lỗi kết nối tới Server!');
      }
    } catch (err) {
      setError('Không thể kết nối Server! Vui lòng bật lại chay_server_python.bat');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-gradient)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '40px 48px',
        width: '420px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.06)',
        border: '1px solid rgba(255,255,255,0.6)',
        textAlign: 'center'
      }}>
        
        <div style={{ marginBottom: '32px' }}>
          <img src={LOGO_URL} alt="DNU Mascot" style={{ width: '150px', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
            {isRegister ? 'Đăng ký Tài Khoản' : 'Hệ Thống AI DNU'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
            {isRegister ? 'Điền tên đăng nhập & mật khẩu mới' : 'Vui lòng đăng nhập để lưu trữ cuộc trò chuyện'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '24px', fontWeight: 500, border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative' }}>
            <User size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '16px' }} />
            <input 
              type="text" 
              placeholder="Tên đăng nhập" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px',
                border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '15px', 
                outline: 'none', transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '16px' }} />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px',
                border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '15px', 
                outline: 'none', transition: 'all 0.3s ease'
              }}
            />
          </div>

          <button 
             type="submit" 
             disabled={loading}
             style={{
               background: 'var(--primary-gradient)', color: 'white', padding: '16px',
               borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 600,
               cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
               gap: '8px', boxShadow: '0 8px 24px rgba(234, 91, 12, 0.25)', marginTop: '8px',
               transition: 'all 0.3s ease'
             }}
          >
            {loading ? <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : (isRegister ? 'Đăng Ký' : 'Đăng Nhập')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          {isRegister ? 'Đã có tài khoản? ' : 'Bạn là Tân Sinh viên mới? '}
          <span 
             onClick={() => { setIsRegister(!isRegister); setError(''); }}
             style={{ color: 'var(--primary-orange)', fontWeight: 600, cursor: 'pointer' }}
          >
            {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;
