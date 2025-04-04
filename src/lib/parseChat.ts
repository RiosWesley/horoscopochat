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
// Flags: 'i' for case-insensitive AM/PM
const messageRegex = /^(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*[-–]\s*(?:([^:]+):\s)?(.*)$/i;
// Note: System messages often follow the same initial pattern but lack the 'Sender:' part, 
// or have specific structures. We'll try the main regex first and handle system messages
// based on whether a sender was captured or by specific keywords.

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
    const match = line.match(messageRegex);

    if (match) {
      // It's a new message line (or system message starting with date/time)
      const [_, dateStr, timeStr, sender, messageContent] = match;
      
      const timestamp = parseWhatsAppDateTime(dateStr, timeStr);
      let isSystem = !sender; // Initial check

      const trimmedMessageContent = messageContent.trim();
      const lowerMessageContent = trimmedMessageContent.toLowerCase();

      // Refined system message check:
      // 1. No sender captured initially
      // 2. Specific keywords found even if sender *was* captured (e.g., edited message)
      // 3. Keywords found when no sender was captured
      const isEditedMessage = lowerMessageContent === 'mensagem editada' || lowerMessageContent === '<mensagem editada>' || lowerMessageContent === 'message edited' || lowerMessageContent === '<message edited>';
      
      if (!isSystem && sender) { // Check even if sender exists
        isSystem = isEditedMessage; 
      } else if (isSystem && messageContent) { // Check keywords only if initially thought to be system
         isSystem = systemMessageKeywords.some(keyword => lowerMessageContent.includes(keyword));
      }
      // Ensure edited messages are always marked as system, even if keywords didn't catch them initially
      if (isEditedMessage) {
        isSystem = true;
      }


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
const parseWhatsAppDateTime = (dateStr: string, timeStr: string): Date | null => {
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

    // Handle time with optional seconds and AM/PM
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?/i);
    if (!timeMatch) {
       console.error(`Invalid time format: "${timeStr}"`);
       return null;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0; // Default seconds to 0
    const ampm = timeMatch[4]?.toUpperCase();

    // Adjust hours for AM/PM
    if (ampm) {
      if (hours === 12) { // Handle midnight (12 AM) and noon (12 PM)
        hours = (ampm === 'AM') ? 0 : 12;
      } else if (ampm === 'PM') {
        hours += 12;
      }
    }

    // Basic validation
    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      throw new Error(`Invalid date/time components: D=${day}, M=${month}, Y=${year}, H=${hours}, Min=${minutes}, S=${seconds}`);
    }
    
    // Further validation (e.g., day <= 31, month <= 11) could be added

    return new Date(year, month, day, hours, minutes, seconds);

  } catch (error) {
    console.error(`Failed to parse date/time: "${dateStr}", "${timeStr}"`, error);
    return null;
  }
};
