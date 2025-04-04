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
  totalResponseTimeMs: number; // Sum of response times in milliseconds
  responseCount: number; // Number of times this sender responded
  averageResponseTimeMinutes: number | null; // Average response time in minutes
}

// Define structure for common expressions
export interface ExpressionData {
  text: string;
  count: number;
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
  expressionCounts: Record<string, number>; // Counts for common expressions (bigrams)
  topExpressions: ExpressionData[]; // Top N expressions
  signoDescription: string | null; // Placeholder for description generated by heuristics
  averageResponseTimesMinutes: Record<string, number | null>; // Average response time per sender
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
    totalResponseTimeMs: 0,
    responseCount: 0,
    averageResponseTimeMinutes: null,
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
    statsPerSender: {},
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
    expressionCounts: {}, // Initialize expression counts
    topExpressions: [], // Initialize top expressions
    signoDescription: null,
    averageResponseTimesMinutes: {}, // Initialize response times
  };

  // Initialize overall keyword counts map
  Object.keys(keywords).forEach(key => {
    results.keywordCounts[key] = 0;
  });

  // Initialize peak hours map
  for (let i = 0; i < 24; i++) {
    results.peakHours[i] = 0;
  }

  // --- Response Time Calculation Prep ---
  let lastMessageTimestamp: Date | null = null;
  let lastSender: string | null = null;
  const lastMessageTimestampBySender: Record<string, Date> = {}; // Track last message time for *each* sender

  messages.forEach(msg => {
    // Skip system messages or messages without content/sender/timestamp
    if (msg.isSystemMessage || !msg.message || !msg.sender || !msg.timestamp) return;

    results.totalMessages++;

    let senderStats: SenderStats | undefined;
    if (msg.sender) {
      if (!results.statsPerSender[msg.sender]) {
        results.statsPerSender[msg.sender] = initializeSenderStats();
      }
      senderStats = results.statsPerSender[msg.sender];
      senderStats.messageCount++;
      results.messagesPerSender[msg.sender] = senderStats.messageCount;
      senderStats.totalLength += msg.message.length;

      // --- Response Time Calculation ---
      // Check if there was a previous message *and* it was from a different sender
      if (lastMessageTimestamp && lastSender && lastSender !== msg.sender) {
        const timeDiffMs = msg.timestamp.getTime() - lastMessageTimestamp.getTime();
        // Add response time to the *current* sender's stats
        senderStats.totalResponseTimeMs += timeDiffMs;
        senderStats.responseCount++;
      }
      // Update the last message details for the next iteration
      lastMessageTimestamp = msg.timestamp;
      lastSender = msg.sender;
      lastMessageTimestampBySender[msg.sender] = msg.timestamp; // Keep track per sender if needed later
    }

    // --- Other Overall Stats & Per-Sender where applicable ---
    const emojis = msg.message.match(emojiRegex);
    if (emojis) {
      emojis.forEach(emoji => {
        const baseEmoji = emoji.replace(/[\uFE0F\uFE0E]/g, '');
        results.emojiCounts[baseEmoji] = (results.emojiCounts[baseEmoji] || 0) + 1;
        if (senderStats) senderStats.emojiCounts[baseEmoji] = (senderStats.emojiCounts[baseEmoji] || 0) + 1;
      });
    }

    if (msg.timestamp) {
      const hour = msg.timestamp.getHours();
      results.peakHours[hour] = (results.peakHours[hour] || 0) + 1;
    }

    results.totalMessageLength += msg.message.length;

    const lowerCaseMessage = msg.message.toLowerCase();

    // Keyword category counting
    for (const category in keywords) {
      const regex = keywords[category as keyof typeof keywords];
      if (regex.global) regex.lastIndex = 0;
      const matches = lowerCaseMessage.match(regex);
      if (matches) {
        const count = matches.length;
        results.keywordCounts[category] = (results.keywordCounts[category] || 0) + count;
        if (senderStats) senderStats.keywordCounts[category] = (senderStats.keywordCounts[category] || 0) + count;
      }
    }

    // Word Counting & Expression (Bigram) Counting
    const cleanedMessage = lowerCaseMessage
      .replace(/<mídia oculta>/g, '')
      .replace(/<media omitted>/g, '')
      .replace(/<arquivo omitido>/g, '')
      .replace(/[.,!¡¿;:"“”()[\]{}<>«»]/g, '');
    const words = cleanedMessage.split(/\s+/).filter(w => w && w.length >= 3 && !stopWords.has(w) && !emojiRegex.test(w) && isNaN(Number(w))); // Filter significant words

    let previousWord: string | null = null;
    words.forEach(word => {
      // Count single words
      results.wordCounts[word] = (results.wordCounts[word] || 0) + 1;

      // Count bigrams (two-word expressions)
      if (previousWord) {
        const bigram = `${previousWord} ${word}`;
        results.expressionCounts[bigram] = (results.expressionCounts[bigram] || 0) + 1;
      }
      previousWord = word;
    });

    // Punctuation Emphasis Counting
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

    // CAPS Word Counting
    const capsMatches = msg.message.match(capsWordRegex);
    if (capsMatches) {
       const count = capsMatches.length;
       results.capsWordCount += count;
       if (senderStats) senderStats.capsWordCount += count;
    }
  });

  // --- Final Calculations ---
  if (results.totalMessages > 0) {
    results.averageMessageLength = Math.round(results.totalMessageLength / results.totalMessages);
  }

  for (const sender in results.statsPerSender) {
    const stats = results.statsPerSender[sender];
    // Calculate Average Length
    if (stats.messageCount > 0) {
      stats.averageLength = Math.round(stats.totalLength / stats.messageCount);
    }
    // Calculate Average Response Time
    if (stats.responseCount > 0) {
      const avgMs = stats.totalResponseTimeMs / stats.responseCount;
      stats.averageResponseTimeMinutes = Math.round(avgMs / (1000 * 60)); // Convert ms to minutes
    } else {
      stats.averageResponseTimeMinutes = null; // Or 0, or some indicator of no responses tracked
    }
    // Populate the main results object
    results.averageResponseTimesMinutes[sender] = stats.averageResponseTimeMinutes;
  }

  let maxEmojiCount = 0;
  for (const emoji in results.emojiCounts) {
    if (results.emojiCounts[emoji] > maxEmojiCount) {
      maxEmojiCount = results.emojiCounts[emoji];
      results.mostFrequentEmoji = emoji;
    }
  }

  let maxKeywordCount = 0;
  for (const category in results.keywordCounts) {
     if (results.keywordCounts[category] > maxKeywordCount) {
       maxKeywordCount = results.keywordCounts[category];
       results.mostFrequentKeywordCategory = category;
     }
  }

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

   // Find top N expressions (bigrams)
   const minExpressionFrequency = 3; // Require expression to appear at least 3 times
   results.topExpressions = Object.entries(results.expressionCounts)
     .filter(([, count]) => count >= minExpressionFrequency)
     .sort(([, countA], [, countB]) => countB - countA)
     .slice(0, 5) // Get top 5
     .map(([text, count]) => ({ text, count }));

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
