import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserX, Crown, User, AlertCircle, Plus } from 'lucide-react';

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/users');
      if (res.data.status === 'success') {
        setUsers(res.data.users);
      } else {
        setError('Không tải được danh sách nhân sự');
      }
    } catch (e) {
      setError('Lỗi kết nối Server!');
    }
    setLoading(false);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setAddLoading(true);
    setError(''); setSuccess('');
    
    try {
      const res = await axios.post('http://127.0.0.1:8000/register', { username: newUsername, password: newPassword });
      if (res.data.status === 'success') {
        setSuccess(`Tạo thành công User: ${newUsername}`);
        setNewUsername(''); setNewPassword('');
        setShowAddForm(false);
        fetchUsers();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối khi tạo tài khoản');
    }
    setAddLoading(false);
  };

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN tài khoản "${username}" không?`)) return;
    setError(''); setSuccess('');
    try {
      const res = await axios.delete(`http://127.0.0.1:8000/users/${id}`);
      if (res.data.status === 'success') {
        setSuccess(`Đã xóa tài khoản ${username}`);
        fetchUsers();
      }
    } catch (err) {
      setError('Không thể xóa tài khoản này');
    }
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    setError(''); setSuccess('');
    try {
      const res = await axios.put(`http://127.0.0.1:8000/users/${id}/role`, { role: newRole });
      if (res.data.status === 'success') {
        setSuccess('Đã cập nhật phân quyền thành công');
        fetchUsers();
      }
    } catch (err) {
      setError('Không thể đổi quyền tài khoản này');
    }
  };

  return (
    <div style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--primary-orange)" /> Quản Lý Tài Khoản Nhân Sự
          </h1>
          <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>Hệ thống cấp quyền truy cập BotChat DNU</p>
        </div>
        
        <button 
           className="btn-solid" 
           onClick={() => setShowAddForm(!showAddForm)}
           style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', borderRadius: '12px' }}
        >
          <Plus size={18} /> Cấp Tài Khoản Mới
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18}/> {error}</div>}
      {success && <div style={{ background: '#ecfdf5', color: '#10b981', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontWeight: 500 }}>{success}</div>}

      {showAddForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', marginBottom: '32px', border: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>Tạo Nhân sự mới</h3>
          <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>Tên đăng nhập</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none' }} placeholder="Nhập tên đăng nhập..." />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>Mật khẩu mặc định</label>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none' }} placeholder="Ví dụ: dnu123..." />
            </div>
            <button type="submit" disabled={addLoading} className="btn-solid" style={{ borderRadius: '12px', height: '44px', padding: '0 24px' }}>
              {addLoading ? 'Đang tạo...' : 'Xác nhận Tạo'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            <tr>
              <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Tên đăng nhập (Username)</th>
              <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Chức Vụ</th>
              <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Đang tải dữ liệu...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.3s' }}>
                <td style={{ padding: '16px 24px', color: '#9ca3af' }}>#{u.id}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1f2937' }}>{u.username}</td>
                <td style={{ padding: '16px 24px' }}>
                  {u.role === 'admin' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 91, 12, 0.1)', color: 'var(--primary-orange)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      <Crown size={14} /> Quản Trị Viên (Admin)
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f3f4f6', color: '#4b5563', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      <User size={14} /> Học Viên (Student)
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  {/* Không cho tự xóa hay giáng cấp tài khoản admin gốc */}
                  {u.username.toLowerCase() !== 'admin' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button 
                         onClick={() => toggleRole(u.id, u.role)}
                         style={{ background: 'none', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'all 0.2s' }}
                      >
                         {u.role === 'admin' ? 'Giáng cấp (Student)' : 'Nâng cấp (Admin)'}
                      </button>
                      <button 
                         onClick={() => deleteUser(u.id, u.username)}
                         style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                      >
                         <UserX size={14} /> Xóa
                      </button>
                    </div>
                  ) : (
                     <span style={{ color: '#9ca3af', fontSize: '13px' }}>Tài khoản tối cao</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersAdmin;
