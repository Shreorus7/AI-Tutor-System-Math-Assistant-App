import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Message } from "../types";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string, history: Content[] = []) => {
  genAI = new GoogleGenAI({ apiKey });
  chatSession = genAI.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4, // Lower temperature for more precise tutoring
    },
    history: history
  });
};

export const formatHistory = (messages: Message[]): Content[] => {
  return messages
    .filter(msg => !msg.isError && msg.id !== 'welcome') // Skip error messages and the static welcome message
    .map(msg => {
      const parts: Part[] = [];
      if (msg.image) {
        const cleanBase64 = msg.image.split(',')[1] || msg.image;
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        });
      }
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      return {
        role: msg.role,
        parts: parts
      };
    });
};

export const sendMessageToGemini = async (
  text: string,
  base64Image?: string
): Promise<string> => {
  // Explicit connectivity check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error("No internet connection. Please check your network settings.");
  }

  if (!chatSession) {
    throw new Error("Gemini session not initialized.");
  }

  let messagePayload: string | Array<any> = text;

  if (base64Image) {
    // If image is provided, we need to construct a multipart message
    // Clean the base64 string to remove the data URL prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    
    messagePayload = [
      {
        inlineData: {
          mimeType: 'image/jpeg', // Assuming JPEG or PNG, model handles both well
          data: cleanBase64
        }
      },
      {
        text: text
      }
    ];
  }

  try {
    const response = await chatSession.sendMessage({ message: messagePayload });
    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // enhance error message for common issues
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error("Network error: Unable to reach Gemini servers. Please check your internet connection.");
    }
    
    throw error;
  }
};