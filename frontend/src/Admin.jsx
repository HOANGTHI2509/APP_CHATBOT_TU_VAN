import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Eye, Play, CheckCircle2, XCircle, Loader2, Database, LayoutList, Calendar } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'archive'
  
  // Băng chuyền queue
  const [queue, setQueue] = useState([]);
  
  // Trình xem kết quả (Viewer/Editor)
  const [viewingFile, setViewingFile] = useState(null); 
  const [editorText, setEditorText] = useState('');
  
  // Kho lưu trữ (Archive)
  // === XỬ LÝ KÉO THẢ & CHỌN NHIỀU FILE ===
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substring(2, 9),
        fileObj: f,
        name: f.name,
        sizeMB: (f.size / (1024 * 1024)).toFixed(2),
        useAI: false,
        useTesseract: false,
        autoAI: false,
        progress: 0,
        status: 'idle', // idle, uploading, processing, done, error
        text: '',
        errorMessage: ''
      }));
      setQueue(prev => [...prev, ...newFiles]);
    }
    e.target.value = null; // reset
  };

  const removeFromFileQueue = (id) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const toggleAI = (id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, useAI: !q.useAI, useTesseract: false } : q));
  };
  const toggleTesseract = (id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, useTesseract: !q.useTesseract, useAI: false } : q));
  };
  const toggleAutoAI = (id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, autoAI: !q.autoAI } : q));
  };

  // === BẮT ĐẦU CHẠY BĂNG CHUYỀN ===
  const startBatchProcessing = async () => {
    // Chỉ lấy file chưa chạy xong
    const pendingFiles = queue.filter(q => q.status === 'idle' || q.status === 'error');
    if (pendingFiles.length === 0) return;

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === 'done') continue;

      const currentFile = queue[i];
      // Đổi trạng thái Uploading
      setQueue(prev => prev.map(q => q.id === currentFile.id ? { ...q, status: 'uploading', progress: 10 } : q));

      const formData = new FormData();
      formData.append("file", currentFile.fileObj);
      formData.append("use_ai", currentFile.useAI ? "true" : "false");
      formData.append("use_tesseract", currentFile.useTesseract ? "true" : "false");
      formData.append("auto_ai", currentFile.autoAI ? "true" : "false");

      try {
        const response = await axios.post('http://127.0.0.1:8000/extract', formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || currentFile.fileObj.size));
            if (percentCompleted < 90) {
              setQueue(prev => prev.map(q => q.id === currentFile.id ? { ...q, progress: percentCompleted } : q));
            } else {
              setQueue(prev => prev.map(q => q.id === currentFile.id ? { ...q, progress: 99, status: 'processing' } : q));
            }
          }
        });

        if (response.data.status === 'success') {
          setQueue(prev => prev.map(q => q.id === currentFile.id ? { 
            ...q, 
            status: 'done', 
            progress: 100, 
            text: response.data.text 
          } : q));
        } else {
          setQueue(prev => prev.map(q => q.id === currentFile.id ? { 
            ...q, 
            status: 'error', 
            progress: 0, 
            errorMessage: response.data.message 
          } : q));
        }
      } catch (err) {
        setQueue(prev => prev.map(q => q.id === currentFile.id ? { 
          ...q, 
          status: 'error', 
          progress: 0, 
          errorMessage: 'Lỗi máy chủ Python không trả lời.' 
        } : q));
      }
    }
  };

  // === ĐẨY VÀO LANGFLOW SAU KHI XONG ===
  const pushToLangflow = async (queueItem, silent = false) => {
    if (!queueItem || !queueItem.text) return false;
    setQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'processing', progress: 50 } : q));
    
    const fileBlob = new Blob([queueItem.text], { type: 'text/plain' });
    const formData = new FormData();
    formData.append("file", fileBlob, queueItem.name.replace(/\.[^/.]+$/, "") + "_cleaned.txt");

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.data.status === 'success') {
         if (!silent) toast.success("Đã nạp dữ liệu sạch vào Bộ nhớ AI thành công!");
         // Xóa file khỏi hàng đợi vì đã nạp xong
         setQueue(prev => prev.filter(q => q.id !== queueItem.id));
         setViewingFile(null); // Đóng khung xem
         return true;
      } else {
         if (!silent) toast.error("Lỗi đẩy Langflow: " + response.data.message);
         setQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'error' } : q));
         return false;
      }
    } catch (e) {
      if (!silent) toast.error("Lỗi mạng khi đẩy vào Langflow!");
      setQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'error' } : q));
      return false;
    }
  };

  const pushAllToLangflow = async () => {
    const doneFiles = queue.filter(q => q.status === 'done');
    if (doneFiles.length === 0) return;

    let successCount = 0;
    for (let i = 0; i < doneFiles.length; i++) {
        const success = await pushToLangflow(doneFiles[i], true);
        if (success) successCount++;
    }
    toast.success(`Hoàn tất! Nạp thành công ${successCount}/${doneFiles.length} file vào Database!`);
  };

  // === TẢI KHO LƯU TRỮ ===
  const fetchArchive = async () => {
    setLoadingArchive(true);
    try {
       const res = await axios.get('http://127.0.0.1:8000/files');
       if (res.data.status === 'success') {
          setArchiveFiles(res.data.files);
       }
    } catch (e) {
       console.error(e);
    }
    setLoadingArchive(false);
  };

  useEffect(() => {
    if (activeTab === 'archive') {
      fetchArchive();
    }
  }, [activeTab]);

  const viewArchivedFile = async (filename) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/view-file/${filename}`);
      if (res.data.status === 'success') {
        setViewingFile({ name: filename });
        setEditorText(res.data.content);
      }
    } catch (e) {
      toast.error("Không tải được nội dung file.");
    }
  };

  // === RENDER TRÌNH XEM (EDITOR) ===
  if (viewingFile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="header" style={{ padding: '16px 24px' }}>
          <div>
            <h1 style={{ color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
               <FileText size={20} /> Xem / Biên tập file: {viewingFile.name}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline" onClick={() => { setViewingFile(null); setEditorText(''); }}>
               ← Quay lại
            </button>
            {viewingFile.id && viewingFile.status !== 'error' && ( /* Nếu là queue item thì có nút đẩy */
              <button className="btn-solid" onClick={() => pushToLangflow({ ...viewingFile, text: editorText })}>
                 Duyệt & Đảy Vào Langflow →
              </button>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, borderRight: '1px solid #ddd', padding: '16px', height: '100%', overflowY: 'auto' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '12px', color: '#6b7280' }}>RAW TEXT (SOẠN THẢO)</div>
            <textarea 
               value={editorText} 
               onChange={(e) => setEditorText(e.target.value)}
               style={{ width: '100%', height: 'calc(100% - 24px)', padding: '16px', border: '1px solid #eee', borderRadius: '12px', outline: 'none', resize: 'none', fontSize: '14px', lineHeight: '1.5', fontFamily: 'monospace' }} 
            />
          </div>
          <div className="markdown-preview" style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#fdfdfd', height: '100%' }}>
            <div style={{ marginBottom: '12px', fontWeight: 700, fontSize: '12px', color: '#059669', position: 'sticky', top: 0, background: '#fdfdfd', zIndex: 1, paddingBottom: '8px', borderBottom: '1px solid #d1fae5' }}>
               👁️ HIỂN THỊ THỰC TẾ TRÊN AI CHATBOT
            </div>
            <div style={{ height: 'auto' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{editorText || '*Chưa có dữ liệu*'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER CHÍNH ===
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      
      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
        <button 
           className={activeTab === 'queue' ? 'btn-solid' : 'btn-outline'} 
           onClick={() => setActiveTab('queue')}
        >
          <LayoutList size={18} style={{marginRight: 6}} /> Băng Chuyền Nạp
        </button>
        <button 
           className={activeTab === 'archive' ? 'btn-solid' : 'btn-outline'} 
           onClick={() => setActiveTab('archive')}
        >
          <Database size={18} style={{marginRight: 6}} /> Kho Lưu Trữ (ChromaDB)
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
        
        {/* PANEL TRÁI (UPLOAD ZONE) CHỈ HIỆN KHI Ở TAB "BĂNG CHUYỀN" */}
        {activeTab === 'queue' && (
          <div style={{ width: '30%', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#1f2937' }}>Tải Tài Liệu (Hàng Loạt)</h3>
            
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              id="batch-upload" 
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }} 
            />
            <label htmlFor="batch-upload" style={{ 
              border: '2px dashed #d1d5db', 
              borderRadius: '16px', 
              padding: '40px 20px', 
              textAlign: 'center', 
              cursor: 'pointer',
              background: '#f9fafb',
              transition: 'all 0.3s ease',
              display: 'block',
              marginBottom: '24px'
            }}>
              <UploadCloud size={48} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: '#4b5563', fontSize: '15px' }}>KÉO THẢ HOẶC CHỌN NHIỀU FILE</div>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Hỗ trợ PDF, DOCX, TXT. Dung lượng tới 50MB/file.</div>
            </label>

            <div style={{ padding: '16px', background: 'rgba(234, 91, 12, 0.05)', borderRadius: '12px', border: '1px solid rgba(234, 91, 12, 0.1)' }}>
               <h4 style={{ fontSize: '14px', color: 'var(--primary-orange)', marginBottom: '8px' }}>🤖 Cơ chế quét đa nhiệm:</h4>
               <ul style={{ fontSize: '13px', color: '#4b5563', paddingLeft: '16px', lineHeight: '1.6' }}>
                  <li><strong>Fast OCR:</strong> Đọc ngay lập tức (1 giây) với PDF thường/Word.</li>
                  <li><strong>Vision AI OCR:</strong> Chụp & đọc cực sâu (15 giây). Dành cho PDF Scan/Tài liệu hỏng font chữ.</li>
               </ul>
            </div>
            
            <div style={{ marginTop: 'auto' }}>
               <button 
                  className="btn-solid" 
                  style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                  onClick={startBatchProcessing}
                  disabled={queue.length === 0 || queue.every(q => q.status === 'done')}
               >
                 <Play size={20} style={{ marginRight: '8px' }} /> BẮT ĐẦU XỬ LÝ {queue.filter(q => q.status !== 'done').length > 0 ? `(${queue.filter(q => q.status !== 'done').length} FIle)` : ''}
               </button>
            </div>
          </div>
        )}

        {/* PANEL PHẢI (QUEUE LIST HOẶC ARCHIVE LIST) */}
        <div style={{ flex: 1, background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', border: '1px solid #eee', overflowY: 'auto' }}>
          
          {activeTab === 'queue' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutList size={20} /> Hàng Đợi Băng Chuyền ({queue.length})
                </h3>
                {queue.filter(q => q.status === 'done').length > 0 && (
                   <button onClick={pushAllToLangflow} className="btn-solid" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                      <Database size={16} style={{ marginRight: '6px' }} /> Nạp Nhanh Vô Kho (Bỏ qua Duyệt)
                   </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '60px' }}>
                  <LayoutList size={64} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>Hãy ném file vào lưới Băng Chuyền để hệ thống xử lý.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {queue.map(item => (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      background: item.status === 'error' ? '#fef2f2' : '#f9fafb', 
                      border: `1px solid ${item.status === 'error' ? '#fecaca' : '#f3f4f6'}`, 
                      borderRadius: '16px', 
                      padding: '16px',
                      transition: 'all 0.3s ease'
                    }}>
                      <FileText size={24} color={item.status === 'done' ? '#10b981' : '#6b7280'} style={{ marginRight: '16px' }} />
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>
                          {item.name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({item.sizeMB} MB)</span>
                        </div>
                        
                        {item.status === 'idle' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--primary-orange)', cursor: 'pointer', fontWeight: 600 }}>
                              <input type="checkbox" checked={item.useAI} onChange={() => toggleAI(item.id)} />
                              Bắt buộc dùng AI Đọc Toàn Tập (15s/trang)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>
                              <input type="checkbox" checked={item.useTesseract} onChange={() => toggleTesseract(item.id)} />
                              Dùng Tesseract OCR Offline (Bóc ảnh Free/Nhanh)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#10b981', cursor: item.useAI ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: item.useAI ? 0.5 : 1 }}>
                              <input type="checkbox" checked={item.autoAI} onChange={() => toggleAutoAI(item.id)} disabled={item.useAI} />
                              Chỉ Tự động gọi AI Cứu hộ khi bắt gặp trang Lỗi/Ảnh
                            </label>
                          </div>
                        )}

                        {(item.status === 'uploading' || item.status === 'processing') && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                               <span>{item.status === 'uploading' ? 'Đang tải lên...' : 'AI đang nội suy dữ liệu...'}</span>
                               <span>{item.progress}%</span>
                            </div>
                            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${item.progress}%`, background: 'var(--primary-orange)', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </div>
                        )}

                        {item.status === 'error' && (
                          <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <XCircle size={14} /> Trích xuất thất bại!
                          </div>
                        )}
                        {item.status === 'done' && (
                          <div style={{ fontSize: '13px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <CheckCircle2 size={14} /> Trích xuất hoàn tất toàn tập!
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        {item.status === 'done' && (
                          <button onClick={() => { setViewingFile(item); setEditorText(item.text); }} style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                            <Eye size={16} /> Xem Text & Nạp
                          </button>
                        )}
                        {item.status === 'error' && (
                          <button onClick={() => { setViewingFile(item); setEditorText(item.errorMessage); }} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                            <Eye size={16} /> Xem Chi Tiết Lỗi
                          </button>
                        )}
                        {(item.status === 'idle' || item.status === 'error' || item.status === 'done') && (
                          <button onClick={() => removeFromFileQueue(item.id)} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // KHO LƯU TRỮ ARCHIVE
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} /> File Đã Nạp Vào Langflow ({archiveFiles.length}) 
                <button onClick={fetchArchive} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-orange)' }}><RefreshCw size={16}/></button>
              </h3>

              {loadingArchive ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#6b7280' }}><Loader2 className="spinner" size={32} /></div>
              ) : archiveFiles.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '60px' }}>
                  <Database size={64} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>Kho lưu trữ hiện đang trống rỗng.</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>Hãy qua Tab Băng Chuyền, tải file và ấn nút "Bắt Đầu Xử Lý" để nạp dữ liệu vào kho này nhé!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {archiveFiles.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                          <FileText size={24} color="var(--primary-orange)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>{file.name}</div>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                            <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Calendar size={12}/> {file.date}</span>
                            <span>{file.size}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => viewArchivedFile(file.name)} style={{ padding: '8px 16px', background: 'white', color: 'var(--primary-orange)', border: '1px solid var(--primary-orange)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        Xem lại Text
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Admin;
