import React, { useRef, useState } from 'react';
import { Send, ImagePlus, X, Loader2 } from 'lucide-react';
import { convertFileToBase64 } from '../utils/fileUtils';

interface ChatInputProps {
  onSend: (text: string, image?: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await convertFileToBase64(e.target.files[0]);
        setImage(base64);
      } catch (err) {
        console.error("Failed to read file", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !image) || isLoading) return;

    onSend(text, image || undefined);
    setText('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10">
      <div className="max-w-3xl mx-auto">
        {image && (
          <div className="mb-3 relative inline-block">
            <img 
              src={image} 
              alt="Preview" 
              className="h-20 w-auto rounded-lg border border-slate-200 shadow-sm" 
            />
            <button
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            title="Upload image"
          >
            <ImagePlus size={24} />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={image ? "Add a specific question about this image..." : "Paste your math problem or ask a question..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none min-h-[50px] max-h-[150px]"
              rows={1}
              style={{ height: 'auto', minHeight: '52px' }}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={(!text.trim() && !image) || isLoading}
            className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
              (!text.trim() && !image) || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-700/30'
            }`}
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </form>
        <div className="text-center mt-2">
            <p className="text-xs text-slate-400">
                Upload a photo of your homework for the best results.
            </p>
        </div>
      </div>
    </div>
  );
};
