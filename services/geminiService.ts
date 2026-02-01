
import { GoogleGenAI, Type } from "@google/genai";
import { DemoSite } from "../types";

export const getSmartSearchResults = async (query: string, availableSites: DemoSite[]): Promise<string[]> => {
  if (!query.trim()) return availableSites.map(s => s.id);

  // Inicialização dentro da função para segurança em ambientes de navegador (evita crash de process.env)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const siteListContext = availableSites.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User search query: "${query}". 
      Available items: ${JSON.stringify(siteListContext)}.
      Analyze the user query. It might contain typos or be written slightly wrong. 
      Return the IDs of the items that most closely match the user's intent. 
      Only return a JSON array of strings containing the IDs.`,
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
    console.error("Gemini smart search failed:", error);
    const lowerQuery = query.toLowerCase();
    return availableSites
      .filter(s => 
        s.title.toLowerCase().includes(lowerQuery) || 
        s.description.toLowerCase().includes(lowerQuery)
      )
      .map(s => s.id);
  }
};
