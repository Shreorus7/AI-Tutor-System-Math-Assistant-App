import React, { useState, useEffect, useRef } from 'react';
import { initializeGemini, sendMessageToGemini, formatHistory } from './services/gemini';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { Message } from './types';
import { GraduationCap, KeyRound } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(process.env.API_KEY || null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your AI Tutor System: Math Assistant. Upload a picture of a math or science problem, and I'll help you solve it step-by-step!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle API Key selection if not in env
  useEffect(() => {
    const init = async () => {
      if (!apiKey) {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
           const hasKey = await window.aistudio.hasSelectedApiKey();
           if (hasKey) {
             const key = process.env.API_KEY; // It gets injected
             if (key) {
               setApiKey(key);
               initializeGemini(key);
             }
           }
        }
      } else {
        initializeGemini(apiKey);
      }
    };
    init();
  }, [apiKey]);


  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assume success as per guidelines, but re-trigger check logic implicitly by relying on env injection or reload
        // In this specific sandbox environment, we might just need to wait or reload, but the guidelines say:
        // "Assume the key selection was successful... Do not add delay... The selected API key is available via process.env.API_KEY"
        const key = process.env.API_KEY;
        if (key) {
            setApiKey(key);
            initializeGemini(key);
        }
    }
  };


  const handleSendMessage = async (text: string, image?: string) => {
    if (!apiKey) {
        alert("Please select an API Key first.");
        return;
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || (image ? "Please help me with this problem." : ""),
      image: image
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Re-initialize Gemini to ensure latest key if needed (though we did it in effect)
      // Per guidelines: "Create a new GoogleGenAI instance right before making an API call"
      // to ensure it uses the most up-to-date API key from the dialog.
      if (process.env.API_KEY) {
          const history = formatHistory(messages);
          initializeGemini(process.env.API_KEY, history);
      }
      
      const responseText = await sendMessageToGemini(
        text || (image ? "Solve this problem." : "Continue."),
        image
      );

      const newBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="bg-blue-100 p-4 rounded-full inline-flex mb-6">
                <KeyRound size={48} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">API Key Required</h1>
            <p className="text-slate-600 mb-6">
                To use the AI Tutor System, you need to select a valid Google Cloud Project with the Gemini API enabled.
            </p>
            <button 
                onClick={handleSelectKey}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
                Select API Key
            </button>
            <div className="mt-4 text-xs text-slate-400">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">
                    Billing Information
                </a>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <GraduationCap size={28} />
            <span className="font-bold text-xl tracking-tight">AI Tutor System</span>
          </div>
          <div className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
            Gemini 3.0 Pro Powered
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start w-full mb-6">
               <div className="flex max-w-[75%] gap-3">
                 <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    <GraduationCap size={20} />
                 </div>
                 <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <span className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                    <span className="text-sm text-slate-500">Thinking...</span>
                 </div>
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;