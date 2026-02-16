// API client for Interview Simulation Server
// Communicates with Express backend on port 3010

import { LLMConfig } from '../types';

const API_BASE = '/api';

export interface ServerHealth {
  status: string;
  providers: {
    gemini: boolean;
    openai: boolean;
  };
  defaultProvider: string;
}

export interface ProviderInfo {
  name: string;
  model: string;
  available: boolean;
  clientKeyRequired?: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Check server health and available providers
  async health(): Promise<ServerHealth> {
    return apiFetch('/health');
  },

  // List available providers
  async providers(): Promise<{ providers: ProviderInfo[]; default: string }> {
    return apiFetch('/providers');
  },

  // Generate interviewer response using server-side LLM
  async generateResponse(
    llmConfig: LLMConfig,
    persona: unknown,
    question: unknown,
    candidateResponse: string,
    conversationHistory: unknown[],
    config: unknown,
  ): Promise<{ reaction: string; followUp: string | null; provider: string }> {
    return apiFetch('/interview/respond', {
      method: 'POST',
      body: JSON.stringify({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        model: llmConfig.model,
        persona,
        question,
        candidateResponse,
        conversationHistory,
        config,
      }),
    });
  },

  // Evaluate candidate response using server-side LLM
  async evaluateResponse(
    llmConfig: LLMConfig,
    question: unknown,
    candidateResponse: string,
    config: unknown,
  ): Promise<{ result: unknown; provider: string }> {
    return apiFetch('/interview/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        model: llmConfig.model,
        question,
        candidateResponse,
        config,
      }),
    });
  },

  // Generate closing response
  async generateClosing(
    llmConfig: LLMConfig,
    persona: unknown,
    config: unknown,
    messageCount: number,
  ): Promise<{ response: string; provider: string }> {
    return apiFetch('/interview/closing', {
      method: 'POST',
      body: JSON.stringify({
        provider: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        model: llmConfig.model,
        persona,
        config,
        messageCount,
      }),
    });
  },

  // Synthesize speech for avatar lip-sync
  async synthesizeSpeech(
    text: string,
    voice?: string,
  ): Promise<{ audioContent: string } | null> {
    try {
      return await apiFetch('/tts/synthesize', {
        method: 'POST',
        body: JSON.stringify({ text, voice }),
      });
    } catch {
      return null;
    }
  },
};
