import { ParsedMessage } from './parseChat';
// Regex to find emojis (simplified, might need refinement for complex cases like skin tones)
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

// Define some keywords/patterns to track
// Simple lists for sentiment analysis (expand these for better accuracy)
const positiveWords = ['bom', 'boa', 'ótimo', 'excelente', 'legal', 'feliz', 'gostei', 'adorei', 'amo', 'obrigado', 'parabéns', 'incrível', 'maravilhoso', 'sim', 'claro', 'certo'];
const negativeWords = ['ruim', 'péssimo', 'terrível', 'odeio', 'não', 'nunca', 'jamais', 'triste', 'chato', 'difícil', 'problema', 'pena', 'infelizmente'];

// Function to create regex from word list (matches whole words)
const createWordRegex = (words: string[]) => new RegExp(`\\b(${words.join('|')})\\b`, 'gi');

const keywords = {
  laughter: /\b(kkk+|hahaha+|rsrs+|hehehe+)\b/gi,
  questions: /\?+/g,
  positive: createWordRegex(positiveWords),
  negative: createWordRegex(negativeWords),
  // Punctuation patterns
  emphasisExclamation: /!{3,}/g, // Three or more !
  emphasisQuestion: /\?{3,}/g,  // Three or more ?
};

// Regex for finding all-caps words (3+ letters)
const capsWordRegex = /\b[A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ]{3,}\b/g;

// Common Portuguese stop words (expand as needed)
const stopWords = new Set([
  'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se',
  'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua',
  'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela',
  'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas',
  'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às',
  'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe',
  'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes',
  'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela',
  'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo',
  'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava',
  'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse',
  'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão',
  'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse',
  'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos',
  'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram',
  'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos',
  'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam',
  'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram',
  'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver',
  'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam',
  // Common chat abbreviations/fillers & others
  'vc', 'td', 'tb', 'tbm', 'pra', 'pro', 'pq', 'q', 'né', 'aí', 'la', 'tá', 'to', 'blz', 'vlw', 'flw', 'abs',
  'mim', 'ti', 'si', 'conosco', 'convosco', 'aqui', 'ali', 'lá', 'cá', 'muito', 'pouco', 'sempre', 'nunca',
  'talvez', 'agora', 'hoje', 'ontem', 'amanhã', 'cedo', 'tarde', 'noite', 'dia', 'mês', 'ano', 'hora',
  'minuto', 'segundo', 'então', 'assim', 'sobre', 'sob', 'ante', 'após', 'desde', 'contra', 'perante', 'trás'
]);

// Define structure for per-sender stats
export interface SenderStats {
  messageCount: number;
  totalLength: number;
  averageLength: number;
  emojiCounts: Record<string, number>;
  keywordCounts: Record<string, number>;
  punctuationEmphasisCount: number;
  capsWordCount: number;
  // Add more per-sender stats if needed
}

// Define the structure for the overall analysis results
export interface AnalysisResults {
  totalMessages: number;
  messagesPerSender: Record<string, number>; // Keep simple count for overview
  statsPerSender: Record<string, SenderStats>; // Detailed stats per sender
  emojiCounts: Record<string, number>; // Overall emoji counts
  mostFrequentEmoji: string | null;
  peakHours: Record<number, number>;
  mostActiveHour: number | null;
  keywordCounts: Record<string, number>; // Overall keyword counts
  mostFrequentKeywordCategory: string | null;
  totalMessageLength: number;
  averageMessageLength: number;
  wordCounts: Record<string, number>;
  favoriteWord: string | null;
  punctuationEmphasisCount: number; // Overall punctuation count
  capsWordCount: number; // Overall CAPS count
  signoDescription: string | null; // Placeholder for description generated by heuristics
}

/**
 * Initializes stats for a new sender.
 */
const initializeSenderStats = (): SenderStats => {
  const initialKeywordCounts: Record<string, number> = {};
  Object.keys(keywords).forEach(key => {
    initialKeywordCounts[key] = 0;
  });
  return {
    messageCount: 0,
    totalLength: 0,
    averageLength: 0,
    emojiCounts: {},
    keywordCounts: initialKeywordCounts,
    punctuationEmphasisCount: 0,
    capsWordCount: 0,
  };
};

/**
 * Analyzes the parsed messages to generate insights.
 *
 * @param messages An array of ParsedMessage objects.
 * @returns An AnalysisResults object.
 */
export const analyzeChat = (messages: ParsedMessage[]): AnalysisResults => {
  console.log(`Starting analysis of ${messages.length} parsed messages...`);

  const results: AnalysisResults = {
    totalMessages: 0,
    messagesPerSender: {},
    statsPerSender: {}, // Initialize per-sender stats object
    emojiCounts: {},
    mostFrequentEmoji: null,
    peakHours: {},
    mostActiveHour: null,
    keywordCounts: {},
    mostFrequentKeywordCategory: null,
    totalMessageLength: 0,
    averageMessageLength: 0,
    wordCounts: {},
    favoriteWord: null,
    punctuationEmphasisCount: 0,
    capsWordCount: 0,
    signoDescription: null, // Initialize description
  };

  // Initialize overall keyword counts map
  Object.keys(keywords).forEach(key => {
    results.keywordCounts[key] = 0;
  });

  // Initialize peak hours map
  for (let i = 0; i < 24; i++) {
    results.peakHours[i] = 0;
  }

  messages.forEach(msg => {
    // Skip system messages or messages without content
    if (msg.isSystemMessage || !msg.message) return;

    results.totalMessages++; // Count non-system messages

    // --- Per-Sender Stats ---
    let senderStats: SenderStats | undefined;
    if (msg.sender) {
      // Initialize stats for sender if not already present
      if (!results.statsPerSender[msg.sender]) {
        results.statsPerSender[msg.sender] = initializeSenderStats();
      }
      senderStats = results.statsPerSender[msg.sender];

      // Increment message count for sender
      senderStats.messageCount++;
      results.messagesPerSender[msg.sender] = senderStats.messageCount; // Keep simple count updated

      // Accumulate length for sender
      senderStats.totalLength += msg.message.length;
    }
    // --- End Per-Sender Stats Init ---


    // --- Overall Stats ---
    // Count emojis (overall)
    const emojis = msg.message.match(emojiRegex);
    if (emojis) {
      emojis.forEach(emoji => {
        const baseEmoji = emoji.replace(/[\uFE0F\uFE0E]/g, '');
        results.emojiCounts[baseEmoji] = (results.emojiCounts[baseEmoji] || 0) + 1;
        if (senderStats) { // Count per sender
          senderStats.emojiCounts[baseEmoji] = (senderStats.emojiCounts[baseEmoji] || 0) + 1;
        }
      });
    }

    // Count messages per hour (overall)
    if (msg.timestamp) {
      const hour = msg.timestamp.getHours();
      results.peakHours[hour] = (results.peakHours[hour] || 0) + 1;
    }

    // Accumulate message length (overall)
    results.totalMessageLength += msg.message.length;

    // Count keywords and words
    const lowerCaseMessage = msg.message.toLowerCase();

    // Keyword category counting (overall and per-sender)
    for (const category in keywords) {
      const regex = keywords[category as keyof typeof keywords];
      if (regex.global) regex.lastIndex = 0;
      const matches = lowerCaseMessage.match(regex);
      if (matches) {
        const count = matches.length;
        results.keywordCounts[category] = (results.keywordCounts[category] || 0) + count;
        if (senderStats) { // Count per sender
          senderStats.keywordCounts[category] = (senderStats.keywordCounts[category] || 0) + count;
        }
      }
    }

    // Word Counting for Favorite Word (overall)
    const cleanedMessage = lowerCaseMessage
      .replace(/<mídia oculta>/g, '')
      .replace(/<media omitted>/g, '')
      .replace(/<arquivo omitido>/g, '')
      .replace(/[.,!¡¿;:"“”()[\]{}<>«»]/g, '');
    const words = cleanedMessage.split(/\s+/);
    words.forEach(word => {
      if (word && word.length >= 3 && !stopWords.has(word) && !emojiRegex.test(word) && isNaN(Number(word))) {
        results.wordCounts[word] = (results.wordCounts[word] || 0) + 1;
      }
    });

    // Punctuation Emphasis Counting (overall and per-sender)
    const emphasisExclamationMatches = msg.message.match(keywords.emphasisExclamation);
    if (emphasisExclamationMatches) {
      const count = emphasisExclamationMatches.length;
      results.punctuationEmphasisCount += count;
      if (senderStats) senderStats.punctuationEmphasisCount += count;
    }
    const emphasisQuestionMatches = msg.message.match(keywords.emphasisQuestion);
    if (emphasisQuestionMatches) {
       const count = emphasisQuestionMatches.length;
       results.punctuationEmphasisCount += count;
       if (senderStats) senderStats.punctuationEmphasisCount += count;
    }

    // CAPS Word Counting (overall and per-sender)
    const capsMatches = msg.message.match(capsWordRegex);
    if (capsMatches) {
       const count = capsMatches.length;
       results.capsWordCount += count;
       if (senderStats) senderStats.capsWordCount += count;
    }
    // --- End Overall & Per-Sender Stats ---
  });

  // --- Final Calculations ---
  // Calculate average message length (overall)
  if (results.totalMessages > 0) {
    results.averageMessageLength = Math.round(results.totalMessageLength / results.totalMessages);
  }

  // Calculate average message length (per sender)
  for (const sender in results.statsPerSender) {
    const stats = results.statsPerSender[sender];
    if (stats.messageCount > 0) {
      stats.averageLength = Math.round(stats.totalLength / stats.messageCount);
    }
  }

  // Find the most frequent emoji (overall)
  let maxEmojiCount = 0;
  for (const emoji in results.emojiCounts) {
    if (results.emojiCounts[emoji] > maxEmojiCount) {
      maxEmojiCount = results.emojiCounts[emoji];
      results.mostFrequentEmoji = emoji;
    }
  }

  // Find the most frequent keyword category (overall)
  let maxKeywordCount = 0;
  for (const category in results.keywordCounts) {
     if (results.keywordCounts[category] > maxKeywordCount) {
       maxKeywordCount = results.keywordCounts[category];
       results.mostFrequentKeywordCategory = category;
     }
  }

   // Find the most frequent word (favorite word - overall)
   let maxWordCount = 0;
   const minWordFrequency = 2;
   if (emojiRegex.global) emojiRegex.lastIndex = 0;
   for (const word in results.wordCounts) {
     emojiRegex.lastIndex = 0;
     if (results.wordCounts[word] > maxWordCount && results.wordCounts[word] >= minWordFrequency && !emojiRegex.test(word)) {
       maxWordCount = results.wordCounts[word];
       results.favoriteWord = word;
     }
   }

  // Find the most active hour (overall)
  let maxHourCount = 0;
  for (let hour = 0; hour < 24; hour++) {
    if (results.peakHours[hour] > maxHourCount) {
      maxHourCount = results.peakHours[hour];
      results.mostActiveHour = hour;
    }
  }

  console.log("Analysis complete:", results);
  return results;
};
