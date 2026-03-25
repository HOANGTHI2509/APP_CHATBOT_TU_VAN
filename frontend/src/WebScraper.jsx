import React, { useState } from 'react';
import { Globe, Play, Loader2, Link as LinkIcon, FileText, CheckCircle2, Trash2, Eye, UploadCloud } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';

const WebScraper = () => {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  
  // Danh sách các URL đã cào
  const [scrapedItems, setScrapedItems] = useState([]);

  // Trình xem kết quả (Viewer/Editor)
  const [viewingFile, setViewingFile] = useState(null); 
  const [editorText, setEditorText] = useState('');
  const [isPushing, setIsPushing] = useState(false);

  const handleScrape = async () => {
    if (!scrapeUrl.trim() || !scrapeUrl.startsWith('http')) {
      toast.error("Vui lòng nhập đường dẫn URL hợp lệ (bắt đầu bằng http/https)!");
      return;
    }
    setIsScraping(true);
    
    try {
      const res = await axios.post('http://127.0.0.1:8000/scrape', { url: scrapeUrl });
      if (res.data.status === 'success') {
         // Thêm vào danh sách thay vì mở luôn
         const newItem = {
           id: Math.random().toString(36).substring(2, 9),
           url: scrapeUrl,
           title: res.data.title,
           text: res.data.text,
           date: new Date().toLocaleTimeString(),
           status: 'scraped' // 'scraped' | 'pushed'
         };
         setScrapedItems(prev => [newItem, ...prev]);
         setScrapeUrl('');
         toast.success("Hút toàn bộ Text thành công!");
      } else {
         toast.error(res.data.message);
      }
    } catch (e) {
      toast.error("Lỗi mạng khi cào bài viết (Hãy chắc chắn Link vẫn tồn tại).");
    }
    setIsScraping(false);
  };

  const removeScrapedItem = (id) => {
    setScrapedItems(prev => prev.filter(item => item.id !== id));
  };

  const openEditor = (item) => {
    setViewingFile(item);
    setEditorText(item.text);
  };

  const pushToLangflow = async (isSaveOnly = false) => {
    if (!viewingFile || !editorText) return;
    setIsPushing(true);
    
    const fileBlob = new Blob([editorText], { type: 'text/plain' });
    const formData = new FormData();
    const safeName = viewingFile.title;
    formData.append("file", fileBlob, safeName + ".txt");

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.data.status === 'success') {
         if (isSaveOnly) {
           toast.success("Đã ghi file vào kho lưu trữ. Bạn có thể nạp sau!");
         } else {
           toast.success("Đã lưu & nạp bài viết vào Não bộ AI thành công!");
         }
         // Đánh dấu là đã nạp
         setScrapedItems(prev => prev.map(item => item.id === viewingFile.id ? { ...item, status: isSaveOnly ? 'saved' : 'pushed', text: editorText } : item));
         setViewingFile(null);
      } else {
         toast.error("Lỗi: " + response.data.message);
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ Python!");
    }
    setIsPushing(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {viewingFile ? (
        // === RENDER TRÌNH XEM (EDITOR) ===
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="header" style={{ padding: '16px 24px' }}>
            <div>
              <h1 style={{ color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                 <FileText size={20} /> Trình Sửa Nội Dung Web: {viewingFile.title}.txt
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-outline" onClick={() => { setViewingFile(null); setEditorText(''); }}>
                 ← Quay lại
              </button>
              <button className="btn-outline" style={{ borderColor: 'var(--primary-orange)', color: 'var(--primary-orange)' }} onClick={() => pushToLangflow(true)} disabled={isPushing}>
                 Lưu File & Nạp Sau
              </button>
              <button className="btn-solid" onClick={() => pushToLangflow(false)} disabled={isPushing}>
                 {isPushing ? <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : 'Duyệt & Đảy Vào Langflow →'}
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, background: '#fff' }}>
            {/* RAW TEXT EDITOR */}
            <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '10px', fontWeight: 700, fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                 ✍️ BIÊN TẬP VĂN BẢN (RAW TEXT)
              </div>
              <textarea 
                 value={editorText} 
                 onChange={(e) => setEditorText(e.target.value)}
                 style={{ 
                    flex: 1, width: '100%', padding: '20px', border: '1px solid #f3f4f6', 
                    borderRadius: '16px', outline: 'none', resize: 'none', fontSize: '15px', 
                    lineHeight: '1.6', fontFamily: 'monospace', background: '#fafafa',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                 }} 
              />
            </div>

            {/* AI PREVIEW */}
            <div className="markdown-preview" style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#fff' }}>
              <div style={{ 
                marginBottom: '16px', fontWeight: 700, fontSize: '12px', color: '#059669', 
                position: 'sticky', top: 0, background: '#fff', zIndex: 1, 
                paddingBottom: '12px', borderBottom: '1px solid #ecfdf5',
                display: 'flex', alignItems: 'center', gap: '8px' 
              }}>
                 <CheckCircle2 size={16} /> HIỂN THỊ THỰC TẾ TRÊN AI CHATBOT
              </div>
              <div style={{ fontSize: '15px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                   {editorText || '*Đang chờ dữ liệu hoặc văn bản trống...*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // === RENDER MÀN HÌNH CHÍNH CÀO WEB ===
        <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={28} color="var(--primary-orange)" /> Spider - Cào Dữ Liệu Web
              </h1>
              <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>Bóc tách 100% văn bản từ mọi Website, xuất sang định dạng TXT siêu sạch.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* CỘT NHẬP LINK */}
            <div style={{ flex: 1, background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                 <div style={{ background: 'rgba(234, 91, 12, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                   <LinkIcon size={40} color="var(--primary-orange)" />
                 </div>
                 <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>Nhập đường dẫn URL Website</h2>
                 <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>Gắn Link trang báo, bài đăng, thông báo điện tử vào đây.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="https://dainam.edu.vn/tuyen-sinh-2025/..."
                  style={{ width: '100%', padding: '20px 24px', borderRadius: '16px', border: '2px solid #e5e7eb', fontSize: '16px', outline: 'none', transition: 'all 0.3s ease' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button 
                  onClick={handleScrape}
                  disabled={isScraping}
                  className="btn-solid"
                  style={{ borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isScraping ? 0.7 : 1, fontSize: '16px' }}
                >
                  {isScraping ? <Loader2 size={24} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={24} />} 
                  {isScraping ? 'Đang bóc tách dữ liệu...' : 'KHỞI ĐỘNG NHỆN CÀO WEB'}
                </button>
              </div>
              
              <div style={{ marginTop: '32px', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                 <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <CheckCircle2 size={16} color="var(--primary-orange)"/> Ưu điểm kép:
                 </h4>
                 <ul style={{ fontSize: '13px', color: '#6b7280', paddingLeft: '24px', lineHeight: '1.8' }}>
                    <li>Phá hủy 100% các đoạn Code ẩn, Script theo dõi rác rưởi của đối phương.</li>
                    <li>Rút gọn HTML siêu phàm, biến nó thành Text văn bản nhẹ tênh.</li>
                 </ul>
              </div>
            </div>

            {/* CỘT DANH SÁCH ĐÃ CÀO */}
            <div style={{ flex: 1, background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6', minHeight: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <FileText size={20} color="var(--primary-orange)" /> Dữ Liệu Thu Thập ({scrapedItems.length})
                </h3>
              </div>

              {scrapedItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '100px' }}>
                  <Globe size={64} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>Mạng Nhện hiện tại trống trơn.</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Hãy nhập 1 đường Link và khởi động cào.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scrapedItems.map((item) => (
                    <div key={item.id} style={{ 
                      padding: '16px', 
                      background: item.status === 'pushed' ? '#ecfdf5' : '#f9fafb', 
                      borderRadius: '16px', 
                      border: `1px solid ${item.status === 'pushed' ? '#d1fae5' : '#e5e7eb'}` 
                    }}>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                         {item.title}.txt
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={12} /> {new URL(item.url).hostname} • {item.date}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                           onClick={() => openEditor(item)}
                           style={{ flex: 1, padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                        >
                           <Eye size={16} /> Xem & Biên Tập
                        </button>
                        <button 
                           onClick={() => removeScrapedItem(item.id)}
                           style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' }}
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {item.status === 'saved' && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                           <Database size={14} /> Đã lưu vào kho (Chờ kiểm duyệt nạp)
                        </div>
                      )}
                      {item.status === 'pushed' && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                           <UploadCloud size={14} /> Đã kiểm duyệt & đẩy vào Langflow
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebScraper;
