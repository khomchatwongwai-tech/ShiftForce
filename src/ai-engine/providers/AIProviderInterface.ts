import { AIRequest, AIResponse, AIProviderType } from '../types';

export interface AIProvider {
  id: AIProviderType;
  name: string;
  isAvailable(): boolean;
  generate(request: AIRequest): Promise<AIResponse>;
}
