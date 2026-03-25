import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { MessageSquare, Settings, LogOut, UploadCloud, Database, Users, PlusCircle, History } from 'lucide-react';
import axios from 'axios';
import Chat from './Chat';
import Admin from './Admin';
import UsersAdmin from './UsersAdmin';
import WebScraper from './WebScraper';
import Login from './Login';
import { Toaster } from 'react-hot-toast';

const LOGO_URL = "/abc.png";

const Sidebar = ({ user, onLogout, historyChats, onNewChat, onSelectChat, activeSession }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.includes('/admin');

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={LOGO_URL} alt="DNU Logo" style={{ width: '120px', objectFit: 'contain' }} />
      </div>

      <div className="nav-group">
        <div className="nav-title">&lt;/&gt; CHẾ ĐỘ</div>
        <Link to="/" className={`nav-item ${!isAdminPath ? 'active' : ''}`}>
          <MessageSquare className="nav-icon" /> Phòng Chat AI DNU
        </Link>
        {user.role === 'admin' && (
          <Link to="/admin" className={`nav-item ${isAdminPath ? 'active' : ''}`}>
            <Settings className="nav-icon" /> Quản Trị Viên
          </Link>
        )}
      </div>

      <div className="nav-group" style={{ flex: 1, overflowY: 'auto' }}>
        {isAdminPath && user.role === 'admin' ? (
          <>
            <div className="nav-title">QUẢN TRỊ HỆ THỐNG</div>
            <div style={{ padding: '0 12px', marginBottom: '16px', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
               Hi, {user.username}!
            </div>
            <Link to="/admin" className={`nav-item ${isAdminPath && !location.pathname.includes('/admin/users') && !location.pathname.includes('/admin/scrape') ? 'active' : ''}`}>
              <UploadCloud className="nav-icon" /> Trạm Nạp Dữ Liệu AI
            </Link>
            <Link to="/admin/scrape" className={`nav-item ${location.pathname.includes('/admin/scrape') ? 'active' : ''}`}>
              <Database className="nav-icon" /> Cào Dữ Liệu Web
            </Link>
            <Link to="/admin/users" className={`nav-item ${location.pathname.includes('/admin/users') ? 'active' : ''}`}>
              <Users className="nav-icon" /> Tài Khoản Nhân Sự
            </Link>
          </>
        ) : (
          <>
            <div style={{ padding: '0 12px', marginBottom: '16px', fontWeight: 600, color: '#1f2937' }}>
               Hi, {user.username}!
            </div>
            <button onClick={onNewChat} className="btn-solid" style={{ width: '100%', marginBottom: '20px' }}>
              <PlusCircle size={18} style={{ marginRight: '8px' }} /> Hội thoại mới
            </button>
            <div className="nav-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <History size={14} /> LỊCH SỬ CHAT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {historyChats.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => onSelectChat(c.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: activeSession === c.id ? 'var(--primary-orange)' : 'transparent', 
                    color: activeSession === c.id ? 'white' : '#4b5563',
                    borderRadius: '12px', padding: '12px 14px', fontSize: '14px', 
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: activeSession === c.id ? '0 4px 12px rgba(234,91,12,0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => { if(activeSession !== c.id) e.currentTarget.style.background = '#f3f4f6' }}
                  onMouseLeave={(e) => { if(activeSession !== c.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <MessageSquare size={16} opacity={0.8} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: activeSession === c.id ? 600 : 500, fontSize: '13px' }}>
                    {c.title}
                  </div>
                </div>
              ))}
              {historyChats.length === 0 && (
                <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                   Chưa có lịch sử.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn-outline btn-danger" onClick={onLogout} style={{ width: '100%', color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}>
          <LogOut size={16} style={{ marginRight: '8px' }} /> Đăng Xuất
        </button>
      </div>
    </div>
  );
};

const Layout = ({ children, user, onLogout, historyChats, onNewChat, onSelectChat, activeSession }) => {
  return (
    <div className="layout">
      <Sidebar 
          user={user} 
          onLogout={onLogout} 
          historyChats={historyChats} 
          onNewChat={onNewChat} 
          onSelectChat={onSelectChat}
          activeSession={activeSession}
      />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [historyChats, setHistoryChats] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('dnu_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/history/${user.id}`);
      if (res.data.status === 'success') {
        setHistoryChats(res.data.chats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dnu_user');
    setUser(null);
    setHistoryChats([]);
    setActiveSession(null);
  };

  const startNewChat = () => {
    setActiveSession(null); // Chat.jsx sẽ tự sinh UUID mới nếu null
  };

  const selectChat = (sessionId) => {
    setActiveSession(sessionId);
  };

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
         style: { borderRadius: '12px', background: '#333', color: '#fff', fontSize: '14px', fontWeight: 600 },
         success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
         error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
      }}/>
      <Layout 
         user={user} 
         onLogout={handleLogout} 
         historyChats={historyChats}
         onNewChat={startNewChat}
         onSelectChat={selectChat}
         activeSession={activeSession}
      >
        <Routes>
          <Route path="/" element={<Chat 
                user={user} 
                activeSession={activeSession} 
                onNewMessageSaved={fetchHistory} // Cập nhật Sidebar khi có tin nhắn đầu tiên
          />} />
          <Route path="/admin" element={user.role === 'admin' ? <Admin /> : <Navigate to="/" replace />} />
          <Route path="/admin/scrape" element={user.role === 'admin' ? <WebScraper /> : <Navigate to="/" replace />} />
          <Route path="/admin/users" element={user.role === 'admin' ? <UsersAdmin /> : <Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
