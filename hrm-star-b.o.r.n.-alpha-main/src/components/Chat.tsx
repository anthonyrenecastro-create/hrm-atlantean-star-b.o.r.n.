import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Paperclip, Image as ImageIcon, X, FileText } from 'lucide-react';
import { interpreterService } from '../lib/interpreterService';

interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  image?: string;
  attachments?: Attachment[];
}

interface ChatProps {
  onSentimentUpdate: (sentiment: number) => void;
  onBotResponse?: (text: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ onSentimentUpdate, onBotResponse }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({
        name: file.name,
        type: file.type,
        data: data.split(',')[1] // just the base64 part
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const result = await interpreterService.processUserInput(currentInput, currentAttachments);
      if (result.sentiment !== undefined) {
        onSentimentUpdate(result.sentiment / 5);
      }
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: result.text || "I'm processing the manifold state...",
        sender: 'bot',
        timestamp: Date.now(),
        image: result.image
      };
      setMessages(prev => [...prev, botMsg]);
      if (onBotResponse && result.text) {
        onBotResponse(result.text);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-3xl border border-white/10 overflow-hidden">
      <div className="p-4 border-bottom border-white/5 bg-white/5 flex items-center gap-2">
        <Bot size={18} className="text-blue-400" />
        <span className="text-xs font-mono uppercase tracking-widest text-white/70">Manifold Interface</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white/10 text-white/90 border border-white/10 rounded-tl-none'
              }`}>
                {msg.attachments && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-2 flex items-center gap-2 border border-white/10">
                        {att.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                        <span className="text-[10px] truncate max-w-[100px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.text}
                {msg.image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                    <img src={msg.image} alt="Generated" className="w-full h-auto" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 p-3 rounded-2xl flex gap-1">
              <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/10 rounded-xl p-2 pr-8 flex items-center gap-2 border border-white/10">
                  {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-blue-400" /> : <FileText size={14} className="text-emerald-400" />}
                  <span className="text-[10px] truncate max-w-[120px]">{att.name}</span>
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full"
          >
            <Paperclip size={18} />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Input command or message..."
              className="w-full bg-black/40 border border-white/10 rounded-full py-3 px-5 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
