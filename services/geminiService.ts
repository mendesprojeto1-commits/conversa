
import { GoogleGenAI, Type } from "@google/genai";
import { DemoSite } from "../types";

export const getSmartSearchResults = async (query: string, availableSites: DemoSite[]): Promise<string[]> => {
  if (!query.trim()) return availableSites.map(s => s.id);

  // Verificação robusta para evitar erro de referência "process is not defined"
  let apiKey = '';
  try {
    apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : '') || '';
  } catch (e) {
    apiKey = '';
  }
  
  if (!apiKey) {
    console.warn("API_KEY não configurada no Netlify. Usando busca local.");
    const lowerQuery = query.toLowerCase();
    return availableSites
      .filter(s => 
        s.title.toLowerCase().includes(lowerQuery) || 
        s.description.toLowerCase().includes(lowerQuery)
      )
      .map(s => s.id);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const siteListContext = availableSites.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User search query: "${query}". 
      Available items: ${JSON.stringify(siteListContext)}.
      Analyze the user query. Typos might happen. Return a JSON array of IDs that match.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Erro na busca IA:", error);
    const lowerQuery = query.toLowerCase();
    return availableSites
      .filter(s => s.title.toLowerCase().includes(lowerQuery))
      .map(s => s.id);
  }
};
