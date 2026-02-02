
import { GoogleGenAI, Type } from "@google/genai";
import { DemoSite } from "../types.ts";

export const getSmartSearchResults = async (query: string, availableSites: DemoSite[]): Promise<string[]> => {
  if (!query.trim()) return availableSites.map(s => s.id);

  let apiKey = '';
  try {
    // Tenta obter a chave de várias formas seguras para o navegador
    apiKey = (window as any).process?.env?.API_KEY || '';
  } catch (e) {
    apiKey = '';
  }
  
  if (!apiKey) {
    console.warn("API_KEY não encontrada nas variáveis de ambiente. Usando filtro local.");
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
