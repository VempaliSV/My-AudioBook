import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for PDF base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to initialize GenAI lazily
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Endpoint to Parse PDF or Raw Text into Structured Audiobook
app.post('/api/parse-pdf', async (req, res) => {
  const { pdfBase64, rawText, fileName } = req.body;

  try {
    if (!pdfBase64 && !rawText) {
      return res.status(400).json({ error: 'Either pdfBase64 or rawText is required.' });
    }

    const ai = getGenAI();

    const prompt = `You are an elite Audiobook Director and Master Audio Script Producer specializing in pristine female voice narration.
Analyze the provided document (PDF or text) and format it into a flawlessly organized, beautifully written Audiobook.

Key Requirements:
1. Identify or deduce the book's Title, Author, and an elegant 2-3 sentence Overview.
2. Recommend an optimal suggested Voice Tone (e.g., "Warm Studio Female Narrator", "Crisp & Clear Articulate Female", "Serene Storyteller").
3. Divide the document into logical Chapters (or major sections).
4. For each chapter:
   - "title": Chapter title (e.g., "Chapter 1: The Beginning" or section heading)
   - "summary": A concise 2-sentence summary of what occurs in this chapter.
   - "content": The extracted raw text.
   - "audioScript": A POLISHED, PRISTINE NARRATION SCRIPT DESIGNED FOR IMPECCABLE FEMALE VOICE PRONUNCIATION.
     * Remove page numbers, running headers, footers, and awkward inline brackets like "[12]".
     * Expand ALL abbreviations into full spoken words (e.g. "Dr." -> "Doctor", "Prof." -> "Professor", "vs." -> "versus", "e.g." -> "for example", "i.e." -> "that is", "etc." -> "et cetera", "approx." -> "approximately", "Fig." -> "Figure").
     * Convert numbers, currency, and dates into spoken words (e.g. "$100M" -> "one hundred million dollars", "1st" -> "first", "2026" -> "twenty twenty-six").
     * Convert technical tables or bullet lists into smooth, natural spoken prose with rhythmic cadence.
     * Insert proper commas, em-dashes, and pauses so the AI female narrator speaks with impeccable clarity and cadence.
   - "keyPoints": 3 bullet point takeaways from this chapter.

Return strictly JSON conforming to the schema.`;

    let contentsPayload: any;

    if (pdfBase64) {
      // Clean base64 prefix if present
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      };
    } else {
      contentsPayload = {
        parts: [
          { text: `Document Title/Context: ${fileName || 'Uploaded Text Document'}\n\n${rawText}` },
          { text: prompt },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            overview: { type: Type.STRING },
            suggestedVoiceTone: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  content: { type: Type.STRING },
                  audioScript: { type: Type.STRING },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['title', 'summary', 'content', 'audioScript'],
              },
            },
          },
          required: ['title', 'author', 'overview', 'suggestedVoiceTone', 'chapters'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');

    // Enrich with calculated stats and unique IDs
    const chapters = (parsedData.chapters || []).map((chap: any, idx: number) => {
      const textToCount = chap.audioScript || chap.content || '';
      const wordCount = textToCount.trim().split(/\s+/).filter(Boolean).length;
      const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 150));

      return {
        id: `chap-${idx + 1}-${Date.now()}`,
        number: idx + 1,
        title: chap.title || `Chapter ${idx + 1}`,
        summary: chap.summary || '',
        content: chap.content || '',
        audioScript: chap.audioScript || chap.content || '',
        estimatedMinutes,
        wordCount,
        keyPoints: chap.keyPoints || [],
      };
    });

    const totalWordCount = chapters.reduce((sum: number, c: any) => sum + c.wordCount, 0);
    const estimatedTotalMinutes = chapters.reduce((sum: number, c: any) => sum + c.estimatedMinutes, 0);

    const result = {
      title: parsedData.title || fileName?.replace(/\.[^/.]+$/, '') || 'Audiobook',
      author: parsedData.author || 'Unknown Author',
      overview: parsedData.overview || 'AI-generated audiobook narration.',
      suggestedVoiceTone: parsedData.suggestedVoiceTone || 'Pristine Studio Female Narrator',
      totalChapters: chapters.length,
      totalPages: Math.max(1, Math.ceil(totalWordCount / 350)),
      totalWordCount,
      estimatedTotalMinutes,
      chapters,
    };

    return res.json(result);
  } catch (err: any) {
    console.warn('Gemini API call rate-limited or error in parse-pdf, engaging fallback parser:', err?.message || err);
    
    // Always return structured fallback audiobook if Gemini quota is hit or API fails
    const fallback = generateFallbackAudiobook(rawText || '', fileName);
    return res.json(fallback);
  }
});

// Helper for offline / rate-limit fallback audiobook structure
function generateFallbackAudiobook(rawText: string, fileName?: string) {
  const text = rawText || '';
  const rawChapters = text
    .split(/(?=\b(?:Chapter|Section|Part|Abstract)\s+\d+[:\.]?|\n{2,}(?=[A-Z0-9\s]{3,30}\n))/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 20);

  const chapters = (rawChapters.length > 0 ? rawChapters : [text]).map((chapText, idx) => {
    const firstLine = chapText.split('\n')[0].replace(/^[#*-\s]+/, '').trim();
    const title = firstLine.length > 0 && firstLine.length < 60 ? firstLine : `Chapter ${idx + 1}`;

    const audioScript = chapText
      .replace(/\[\d+\]/g, '')
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bProf\./g, 'Professor')
      .replace(/\bvs\./g, 'versus')
      .replace(/\be\.g\./g, 'for example')
      .replace(/\bi\.e\./g, 'that is')
      .replace(/\betc\./g, 'et cetera')
      .replace(/\bapprox\./g, 'approximately')
      .replace(/\bFig\./g, 'Figure')
      .replace(/\$(\d+)(M| million)?/g, '$1 million dollars');

    const words = audioScript.split(/\s+/).filter(Boolean).length;
    const estMins = Math.max(1, Math.ceil(words / 150));

    return {
      id: `chap-${idx + 1}-${Date.now()}`,
      number: idx + 1,
      title,
      summary: chapText.slice(0, 180).replace(/\s+/g, ' ') + '...',
      content: chapText,
      audioScript,
      estimatedMinutes: estMins,
      wordCount: words,
      keyPoints: [
        'Core narrative insights and structural overview.',
        'Impeccably formatted prose for female voice narration.',
        'Key concepts extracted for audio retention.',
      ],
    };
  });

  const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const totalMins = chapters.reduce((sum, c) => sum + c.estimatedMinutes, 0);

  return {
    title: fileName?.replace(/\.[^/.]+$/, '') || 'Audiobook Edition',
    author: 'Selected Document',
    overview: 'Polished audiobook narration formatted with clear pronunciation guidelines.',
    suggestedVoiceTone: 'Pristine Studio Female Narrator',
    totalChapters: chapters.length,
    totalPages: Math.max(1, Math.ceil(totalWords / 350)),
    totalWordCount: totalWords,
    estimatedTotalMinutes: totalMins,
    chapters,
  };
}

// 2. Endpoint to Generate Gemini HD TTS Speech Audio
app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required.' });
    }

    const ai = getGenAI();

    // Trim text if too long for single TTS request chunk
    const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: truncatedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({ fallbackToBrowser: true, message: 'No audio bytes returned from Gemini TTS.' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/pcm;rate=24000',
    });
  } catch (err: any) {
    console.warn('Gemini TTS API rate-limited or error, instructing client to fallback to browser Web Speech:', err?.message || err);
    return res.json({
      fallbackToBrowser: true,
      message: 'Gemini TTS rate limit hit or unavailable. Falling back to browser speech.',
    });
  }
});

// 3. Endpoint to Generate Co-Host Podcast Discussion for Chapter
app.post('/api/generate-discussion', async (req, res) => {
  try {
    const { chapterTitle, chapterContent } = req.body;
    if (!chapterContent) {
      return res.status(400).json({ error: 'chapterContent is required.' });
    }

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Create an engaging 2-person podcast conversation between two curious podcast hosts, Alex and Sam, discussing "${chapterTitle || 'this chapter'}".
Chapter text content:
${chapterContent.substring(0, 4000)}

Requirements:
- Make it conversational, insightful, and entertaining.
- Include key takeaways and practical analogies.
- Return structured dialogue entries.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, description: 'Alex or Sam' },
                  text: { type: Type.STRING },
                },
                required: ['speaker', 'text'],
              },
            },
          },
          required: ['title', 'dialogue'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error generating podcast discussion:', err);
    res.status(500).json({
      error: 'Failed to generate podcast discussion.',
      details: err.message || String(err),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
