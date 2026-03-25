import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const DNU_LOGO = "/linhvatDNU.png";

const TypewriterMessage = ({ content, isNew }) => {
  const [displayedContent, setDisplayedContent] = useState(isNew ? '' : content);

  useEffect(() => {
    if (!isNew) return;
    let index = 0;
    const interval = setInterval(() => {
      index += 3; // Tốc độ gõ 3 ký tự mỗi frame
      setDisplayedContent(content.substring(0, index));
      if (index >= content.length) {
        clearInterval(interval);
        setDisplayedContent(content);
      }
    }, 10); 
    return () => clearInterval(interval);
  }, [content, isNew]);

  return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{displayedContent}</ReactMarkdown>;
};

const Chat = ({ user, activeSession, onNewMessageSaved }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState('');
  
  const messagesEndRef = useRef(null);

  const initGreeting = {
    id: 1,
    sender: 'bot',
    text: `Xin chào **${user?.username}**! Mình là **Trợ lý AI Đa Năng DNU** 🤖🌟\n\nMình đã được nạp toàn bộ các kiến thức về quy chế, học phí, ký túc xá và các thủ tục hành chính của nhà trường. Bạn cần mình hỗ trợ thông tin gì không?`
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeSession) {
        setCurrentSession(activeSession);
        try {
           setIsLoading(true);
           const res = await axios.get(`http://127.0.0.1:8000/messages/${activeSession}`);
           if (res.data.status === 'success' && res.data.messages.length > 0) {
             const historyMsgs = res.data.messages.map((m, i) => ({
                id: Date.now() + i,
                sender: m.sender,
                text: m.text
             }));
             setMessages(historyMsgs);
           } else {
             setMessages([initGreeting]);
           }
        } catch (e) {
           console.error("Lỗi lấy lịch sử chat:", e);
           setMessages([initGreeting]);
        } finally {
           setIsLoading(false);
        }
      } else {
        // Cuộc hội thoại hoàn toàn mới
        setCurrentSession(Math.random().toString(36).substring(2, 10) + Date.now().toString(36));
        setMessages([initGreeting]);
      }
    };
    
    fetchMessages();
  }, [activeSession, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessageText = input.trim();
    const isFirstMessage = messages.length <= 1; // Chỉ có mỗi lời chào
    
    const userMessage = { id: Date.now(), sender: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        message: userMessageText,
        session_id: currentSession,
        user_id: user.id || 0,
        title: userMessageText // Tiêu đề lấy theo câu chat đầu tiên
      };

      const response = await axios.post('http://127.0.0.1:8000/chat', payload);
      
      let answer = 'Xin lỗi, đã có lỗi kết nối tới máy chủ AI.';
      if (response.data.status === 'success') {
         answer = response.data.answer;
      } else {
         answer = response.data.message || 'Lỗi từ Python backend';
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: answer, isNew: true }]);
      
      if (isFirstMessage && onNewMessageSaved) {
         // Thông báo cho App.jsx tải lại thanh bên trái
         onNewMessageSaved();
      }
      
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: 'Xin lỗi bạn, kết nối Lõi Dữ Liệu bị mất! Bạn vui lòng bật lại `chay_server_python.bat`.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* HEADER */}
      <div className="header" style={{ padding: '24px 32px' }}>
        <div>
          <h1 style={{ color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} /> Hệ Thống Trợ Lý AI DNU
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px', fontWeight: 500 }}>Sử dụng công nghệ RAG + LLM của OpenAI</p>
        </div>
        <div className="status-badge" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="dot"></div> Server Băng Thông Rộng
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ 
        flex: 1, 
        padding: '32px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        scrollBehavior: 'smooth'
      }}>
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id} 
              style={{ 
                display: 'flex', 
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-end', 
                gap: '16px',
                animation: 'fadeInUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}
            >
              {/* AVATAR */}
              {!isUser ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '6px', boxShadow: '0 8px 24px rgba(234, 91, 12, 0.15)', border: '1px solid rgba(255,255,255,0.8)', flexShrink: 0 }}>
                  <img src={DNU_LOGO} alt="DNU" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ background: 'white', color: 'var(--text-gray)', borderRadius: '14px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0  }}>
                  <User size={20} />
                </div>
              )}
              
              {/* BUBBLE */}
              <div 
                className={`msg-bubble ${isUser ? 'msg-user' : 'msg-bot'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {!isUser && idx !== 0 && (
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--primary-orange)', letterSpacing: '0.5px' }}>
                    TRỢ LÝ ẢO DNU
                  </div>
                )}
                <div className={!isUser ? "markdown-preview" : ""}>
                  {!isUser ? (
                    <TypewriterMessage content={msg.text} isNew={msg.isNew} />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{msg.text}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING */}
        {isLoading && messages.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', animation: 'fadeInUp 0.3s forwards' }}>
              <img src={DNU_LOGO} alt="DNU" style={{ width: '38px', height: '38px', opacity: 0.5 }} />
            <div className="msg-bubble msg-bot" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px' }}>
              <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-orange)' }} /> 
              <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '14px' }}>AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: '0 32px 24px 32px', background: 'transparent' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.7)', 
          borderRadius: '24px', padding: '14px 20px', boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease'
        }} className="input-container">
          
          <input 
            type="text" 
            placeholder="Hỏi AI bất kỳ điều gì..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ 
              flex: 1, border: 'none', background: 'transparent', outline: 'none', 
              fontSize: '16px', color: 'var(--text-dark)', fontWeight: 400, padding: '0 12px'
            }}
            disabled={isLoading}
          />
          
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{ 
              background: input.trim() ? 'var(--primary-gradient)' : '#e5e7eb', 
              border: 'none', color: 'white', width: '44px', height: '44px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease',
              boxShadow: input.trim() ? '0 4px 12px rgba(234, 91, 12, 0.3)' : 'none'
            }}
          >
            <Send size={18} style={{ position: 'relative', left: '1px' }} />
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '14px', fontWeight: 500, letterSpacing: '0.2px' }}>
          <AlertCircle size={12} /> Hệ thống AI có thể nhầm lẫn. Vui lòng đối chiếu với các văn bản chính thức của Nhà trường nếu thông tin quan trọng.
        </div>
      </div>
      
    </div>
  );
};

export default Chat;
