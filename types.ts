export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string; // Base64 string for user uploaded images
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  apiKey: string | null;
}
