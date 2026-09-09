import React, { useState } from 'react';
import {
  Send,
  ArrowLeft,
  Phone,
  Video,
  FileCheck,
  CheckCheck,
  Clock,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { ChatThread, ChatMessage } from '../types';

interface MessagesViewProps {
  threads: ChatThread[];
  onSendMessage: (threadId: string, text: string) => void;
  onStartDoctorCall: (doctorName: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  threads,
  onSendMessage,
  onStartDoctorCall,
}) => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const handleSend = () => {
    if (!inputText.trim() || !activeThreadId) return;
    onSendMessage(activeThreadId, inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    'Should I take medication with food?',
    'What should I monitor before our call?',
    'Can I request a prescription renewal?',
  ];

  if (activeThread) {
    return (
      <div id="active-chat-thread" className="flex flex-col h-[calc(100vh-68px)] max-h-[750px] bg-slate-50">
        {/* Chat Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-sky-100 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              id="back-to-threads-btn"
              onClick={() => setActiveThreadId(null)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img
                src={activeThread.doctorAvatar}
                alt={activeThread.doctorName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-100"
              />
              {activeThread.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">
                {activeThread.doctorName}
              </h3>
              <p className="text-[10px] text-sky-700 font-medium">
                {activeThread.doctorSpecialty} • {activeThread.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="chat-voice-call-btn"
              onClick={() => onStartDoctorCall(activeThread.doctorName)}
              className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors"
              title="Call Doctor"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              id="chat-video-call-btn"
              onClick={() => onStartDoctorCall(activeThread.doctorName)}
              className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors"
              title="Start Video Call"
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
          <div className="text-center">
            <span className="px-2.5 py-1 bg-sky-100/70 text-sky-800 text-[10px] font-semibold rounded-full">
              End-to-End Encrypted Telehealth Chat
            </span>
          </div>

          {activeThread.messages.map((msg) => {
            const isPatient = msg.sender === 'patient';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                    isPatient
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-sky-100 rounded-bl-xs'
                  }`}
                >
                  {msg.isPrescription && (
                    <div className="mb-2 p-2 bg-sky-50 rounded-xl border border-sky-100 flex items-center gap-2 text-sky-900 font-semibold text-[11px]">
                      <FileCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span>Prescription Refill Attached (PDF)</span>
                    </div>
                  )}
                  <p className="leading-relaxed">{msg.text}</p>
                </div>

                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                  <span>{msg.timestamp}</span>
                  {isPatient && <CheckCheck className="w-3 h-3 text-sky-500" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(activeThread.id, prompt)}
              className="text-[11px] font-medium bg-sky-50 hover:bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-sky-100 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-sky-100 flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-sky-600 rounded-xl transition-colors"
            title="Attach Document or Photo"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message to the doctor..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
          />
          <button
            id="send-message-btn"
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="messages-view" className="px-5 pt-5 pb-24 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Doctor Messages
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Direct consultation chat and prescription inquiries
        </p>
      </div>

      <div className="space-y-2.5">
        {threads.map((thread) => (
          <div
            key={thread.id}
            id={`thread-item-${thread.id}`}
            onClick={() => setActiveThreadId(thread.id)}
            className="p-3.5 bg-white rounded-2xl border border-sky-100 hover:border-sky-300 shadow-xs flex items-center gap-3.5 cursor-pointer transition-all hover:bg-sky-50/20"
          >
            <div className="relative flex-shrink-0">
              <img
                src={thread.doctorAvatar}
                alt={thread.doctorName}
                className="w-13 h-13 rounded-2xl object-cover ring-1 ring-sky-100"
              />
              {thread.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {thread.doctorName}
                </h3>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {thread.lastMessageTime}
                </span>
              </div>

              <span className="text-[10px] font-semibold text-sky-700">
                {thread.doctorSpecialty}
              </span>

              <p className="text-xs text-slate-500 truncate mt-0.5">
                {thread.lastMessage}
              </p>
            </div>

            {thread.unreadCount > 0 && (
              <span className="w-5 h-5 bg-sky-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {thread.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
