// Define the structure for a parsed message
export interface ParsedMessage {
  timestamp: Date | null; // Use Date object for easier manipulation
  sender: string | null; // null for system messages
  message: string;
  isSystemMessage: boolean; // Flag for system messages
}

// Regular expression to match typical WhatsApp lines (will be refined)
// Example format: 01/01/2024, 10:00 - Sender Name: Message content
// Regex Explanation:
// (\d{1,2}[./]\d{1,2}[./]\d{2,4}) - Date (DD/MM/YY or DD.MM.YYYY etc.)
// ,? - Optional comma separator
// \s* - Optional whitespace
// (\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?) - Time (HH:MM, HH:MM:SS, with optional AM/PM)
// \s* - Optional whitespace
// [-–]\s* - Dash separator (hyphen or en-dash)
// (?:([^:]+):\s)? - Optional Sender Name (non-greedy match until ':') followed by ': '
// (.*) - The actual message content (greedy match)
// Regex patterns to handle different WhatsApp timestamp formats

// Format 1: [DD/MM/YYYY, HH:MM:SS] Sender: Message
const regexFormat1 = /^\[(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s*(\d{1,2}:\d{2}:\d{2})\]\s*(?:([^:]+):\s)?(.*)$/;

// Format 2: DD/MM/YYYY HH:MM da [manhã|tarde|noite] - Sender: Message
// Note: Made "da " optional and sender optional. Handles pt-BR periods.
const regexFormat2 = /^(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s+(\d{1,2}:\d{2})\s+(?:da\s+)?(manhã|tarde|noite)\s*[-–]\s*(?:([^:]+):\s)?(.*)$/i;

// Original Format (Fallback): DD/MM/YY, HH:MM - Sender: Message (handles AM/PM)
const regexOriginal = /^(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*[-–]\s*(?:([^:]+):\s)?(.*)$/i;

// Keywords indicating system messages (add more as needed)
const systemMessageKeywords = [
  'adicionou', 'added', 
  'removeu', 'removed', 
  'saiu', 'left', 
  'entrou usando o link', 'joined using this group\'s invite link',
  'mudou o nome do grupo', 'changed the subject',
  'mudou a descrição do grupo', 'changed the group description',
  'mudou a imagem do grupo', 'changed this group\'s icon',
  'apagou a imagem do grupo', 'deleted this group\'s icon',
  'criou o grupo', 'created group',
  'agora é admin', 'is now an admin',
  'não é mais admin', 'is no longer an admin',
  'As mensagens temporárias estão ativadas', 'Disappearing messages are on',
  'As mensagens temporárias estão desativadas', 'Disappearing messages are off',
  'Você mudou para mensagens temporárias', 'You turned on disappearing messages',
  'Você desativou as mensagens temporárias', 'You turned off disappearing messages',
  // Add more variations if necessary
];

/**
 * Parses the raw text content of a WhatsApp chat export.
 * 
 * @param rawText The raw string content from the .txt file.
 * @returns An array of ParsedMessage objects.
 */
export const parseChat = (rawText: string): ParsedMessage[] => {
  // Filter out potential empty lines and encryption notices often at the start
  const lines = rawText.trim().split('\n').filter(line => line.trim() !== '' && !line.includes('Messages and calls are end-to-end encrypted'));
  const messages: ParsedMessage[] = [];
  let currentMessage: ParsedMessage | null = null;

  console.log(`Starting parsing of ${lines.length} filtered lines.`); // Debug log

  lines.forEach((line) => {
    let match: RegExpMatchArray | null = null;
    let formatType: 'format1' | 'format2' | 'original' | null = null;
    let dateStr: string | undefined;
    let timeStr: string | undefined;
    let period: string | undefined; // For format 2
    let sender: string | undefined;
    let messageContent: string | undefined;

    // Try matching each regex format
    match = line.match(regexFormat1);
    if (match) {
      formatType = 'format1';
      [, dateStr, timeStr, sender, messageContent] = match;
    } else {
      match = line.match(regexFormat2);
      if (match) {
        formatType = 'format2';
        [, dateStr, timeStr, period, sender, messageContent] = match;
      } else {
        match = line.match(regexOriginal);
        if (match) {
          formatType = 'original';
          [, dateStr, timeStr, sender, messageContent] = match;
        }
      }
    }

    if (formatType && dateStr && timeStr && messageContent !== undefined) {
      // It's a new message line (or system message starting with date/time)
      const timestamp = parseWhatsAppDateTime(dateStr, timeStr, period); // Pass period if available
      let isSystem = !sender; // Initial check

      const trimmedMessageContent = messageContent.trim();
      const lowerMessageContent = trimmedMessageContent.toLowerCase();

      // --- Refined System Message Check ---
      // 1. Initial check: Is there a sender? If not, it's likely system.
      // 'isSystem' was already declared above, before this block.
      // let isSystem = !sender; // REMOVED duplicate declaration

      // 2. Explicit check for "edited message" variants. This takes priority.
      const isEditedMessage = lowerMessageContent === 'mensagem editada' || lowerMessageContent === '<mensagem editada>' || lowerMessageContent === 'message edited' || lowerMessageContent === '<message edited>';
      
      if (isEditedMessage) {
          isSystem = true; // Mark as system if it's an edited message notification
      } else if (isSystem) { 
          // 3. If it was initially marked as system (no sender) AND it's NOT an edited message, 
          //    then check against the list of known system message keywords.
          isSystem = systemMessageKeywords.some(keyword => lowerMessageContent.includes(keyword));
      }
      // If it had a sender AND wasn't an edited message, isSystem remains false.
      // --- End Refined System Message Check ---


      currentMessage = {
        timestamp: timestamp,
        sender: sender ? sender.trim() : null, 
        message: trimmedMessageContent,
        isSystemMessage: isSystem, 
      };
      messages.push(currentMessage);

    } else if (currentMessage && !currentMessage.isSystemMessage) {
      // It's a continuation of the previous message (multi-line)
      // Append line only if there's a previous message and it wasn't flagged as system
      currentMessage.message += '\n' + line.trim();
    } else {
      // Line doesn't match the pattern and isn't a continuation. 
      // Could be an initial system message without a timestamp, or noise.
      // Optionally, handle these lines (e.g., log them, add as special message type)
      console.log(`Skipping unmatched line: ${line}`);
    }
  });

  console.log(`Finished parsing. Found ${messages.length} messages.`); // Debug log
  return messages;
};

// Helper function to parse WhatsApp date/time with more flexibility
const parseWhatsAppDateTime = (dateStr: string, timeStr: string, period?: string): Date | null => {
  try {
    // Normalize date separators (replace . or - with /)
    const normalizedDateStr = dateStr.replace(/[.-]/g, '/');
    const dateParts = normalizedDateStr.split('/');

    let day: number, month: number, year: number;

    // Try to determine date format (DD/MM vs MM/DD) - assumes DD/MM/YY(YY) by default
    // A more robust solution might need locale info or user input
    const part1 = parseInt(dateParts[0], 10);
    const part2 = parseInt(dateParts[1], 10);
    const part3 = parseInt(dateParts[2], 10);

    if (part1 > 12 && part2 <= 12) { // Likely DD/MM/YYYY or DD/MM/YY
      day = part1;
      month = part2 - 1; // JS months are 0-indexed
      year = part3;
    } else if (part1 <= 12 && part2 > 12) { // Likely MM/DD/YYYY or MM/DD/YY
      day = part2;
      month = part1 - 1;
      year = part3;
    } else { // Ambiguous (e.g., 05/10/24) or potentially invalid - assume DD/MM/YY(YY)
      // Could add more checks here if needed (e.g., check if part3 looks like a day)
      day = part1;
      month = part2 - 1;
      year = part3;
    }

    // Handle YY vs YYYY year format
    if (year < 100) {
      year += 2000; // Assuming years 00-99 are in the 21st century
    }

    // --- Time Parsing Logic ---
    let hours: number;
    let minutes: number;
    let seconds = 0; // Default seconds

    if (period) { // Format 2: HH:MM da [period]
      const timeParts = timeStr.split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);

      // Adjust hours based on period (Portuguese)
      const lowerPeriod = period.toLowerCase();
      if (lowerPeriod === 'noite' && hours < 12) { // e.g., 7:27 da noite -> 19:27
          hours += 12;
      } else if (lowerPeriod === 'tarde' && hours < 12) { // e.g., 2:00 da tarde -> 14:00
          hours += 12;
      } else if (lowerPeriod === 'manhã' && hours === 12) { // 12:xx da manhã -> 00:xx (midnight)
          hours = 0; 
      }
      // No adjustment needed for "manhã" if hours < 12 (already AM)
      // No adjustment needed for "tarde/noite" if hours >= 12 (assume already 24h like 13:00 da tarde)

    } else { // Format 1 (HH:MM:SS) or Original (HH:MM:SS or HH:MM AM/PM)
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?/i);
      if (!timeMatch) {
         console.error(`Invalid time format: "${timeStr}" (period: ${period || 'none'})`);
         return null;
      }
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const ampm = timeMatch[4]?.toUpperCase();

      // Adjust hours for AM/PM (only if period is not set)
      if (ampm) {
        if (hours === 12) { // Handle 12 AM/PM
          hours = (ampm === 'AM') ? 0 : 12;
        } else if (ampm === 'PM') {
          hours += 12;
        }
      }
    }
    // --- End Time Parsing Logic ---


    // Basic validation
    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
       console.error(`Invalid date/time components derived from: date="${dateStr}", time="${timeStr}", period="${period || 'N/A'}" -> D=${day}, M=${month}, Y=${year}, H=${hours}, Min=${minutes}, S=${seconds}`);
      // Throw error to be caught below
      throw new Error(`Invalid date/time components`);
    }
    
    // Further validation (e.g., day <= 31, month <= 11) could be added

    return new Date(year, month, day, hours, minutes, seconds);

  } catch (error) {
    console.error(`Failed to parse date/time: date="${dateStr}", time="${timeStr}", period="${period || 'N/A'}"`, error);
    return null;
  }
};
