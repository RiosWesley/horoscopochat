# Horóscopo das Mensagens - Project Progress

## Goal

Create a functional web application that analyzes uploaded WhatsApp chat `.txt` files locally in the browser to generate fun, horoscope-style insights based on message content and patterns.

## Current Plan & Status

1.  **File Handling (`InstructionsPage.tsx`):**
    *   [X] Implement reading of the uploaded `.txt` file using `FileReader`.
    *   [X] Store the raw text content in a shared state (React Context).
    *   [X] Navigate to `/analyzing` upon successful file read.
2.  **Parsing (`src/lib/parseChat.ts`):**
    *   [X] Create a function to parse raw text into structured message objects (`{timestamp, sender, message}`).
    *   [X] Handle basic WhatsApp message formats (user messages, system messages, multi-line).
    *   [X] Refine date/time parsing to handle more formats (DD/MM/YY, MM/DD/YY, AM/PM, different separators).
    *   [X] Refine system message detection using keywords. *Further variations might need refinement.*
3.  **Analysis (`src/lib/analyzeChat.ts`):**
    *   [X] Create basic analysis function structure.
    *   [X] Implement counts for total messages and messages per sender.
    *   [X] Implement emoji counting and find most frequent emoji.
    *   [X] Implement peak hour calculation.
    *   [X] Implement counts for basic keywords (laughter, questions, positive, negative).
    *   [X] Implement average message length calculation.
    *   [X] Implement "Palavra Favorita" analysis (most frequent significant word).
    *   [X] Fix "Palavra Favorita" bug related to media placeholders.
    *   [X] Implement punctuation emphasis (!!!, ???) and CAPS word analysis.
    *   [X] Implement simple heuristic rules for generating insights (Signo, Pequenas Verdades) in `ResultsPage.tsx`.
    *   [X] Refine heuristics to incorporate punctuation/CAPS data.
    *   [X] Further refine heuristics for more varied/combined insights (Signo combination, talkative person fact).
4.  **State Management (React Context):**
    *   [X] Set up `ChatAnalysisContext` to hold raw text, parsed messages, analysis results, and loading state.
    *   [X] Use specific types (`ParsedMessage`, `AnalysisResults`).
    *   [X] Update `AnalysisResults` interface with new fields (keywords, avg length, favoriteWord, punctuation, CAPS).
5.  **Page Updates:**
    *   [X] Update `AnalyzingPage` to trigger parsing and analysis, update Context, and navigate.
    *   [X] Update `ResultsPage` to display basic analysis results (total messages, sender counts) from Context, including loading/error states.
    *   [X] Update `ResultsPage` to display most frequent emoji and peak hour.
    *   [X] Update `ResultsPage` to display generated Signo and Pequenas Verdades based on heuristics.
    *   [X] Update `ResultsPage` to display average message length and keyword insights.
    *   [X] Update `ResultsPage` to display "Mix de Vibrações" based on positive/negative keywords.
    *   [X] Update `ResultsPage` to display "Palavra Favorita".
    *   [X] Update heuristics in `ResultsPage.tsx` to use keyword, avg length, punctuation, and CAPS data.
    *   [X] Add Signo description generation and display.
    *   [X] Add per-sender analysis calculation in `analyzeChat.ts`.
    *   [X] Add per-sender analysis display section in `ResultsPage.tsx`.

## Next Steps

*   Consider adding more analysis types (e.g., response times if possible, specific phrase tracking).
*   Further refine chat parsing for any remaining edge cases if needed.
*   Further refine heuristics in `ResultsPage.tsx`.

---
*This file will be updated as development progresses.*
