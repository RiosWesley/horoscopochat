# Arquitetura do Sistema - Análise de Chats com IA e Pagamento Premium

---

## Visão Geral

Este sistema é uma aplicação web que permite ao usuário enviar um chat (ex: WhatsApp), analisar seu conteúdo com técnicas de NLP e IA, e visualizar resultados detalhados, com funcionalidades extras para usuários premium mediante pagamento.

---

## Diagrama Geral (Mermaid)

```mermaid
flowchart TD
    subgraph Frontend
        WelcomePage[WelcomePage]
        InstructionsPage[InstructionsPage]
        AnalyzingPage[AnalyzingPage]
        ResultsPage[ResultsPage]
        PremiumPage[PremiumPage]
        PaymentPage[PaymentPage]
        NotFound[NotFound]

        ChatAnalysisProvider[ChatAnalysisProvider (Contexto)]
        useChatAnalysis[useChatAnalysis (Hook)]
        parseChat[parseChat.ts]
        analyzeChat[analyzeChat.ts]

        WelcomePage --> InstructionsPage
        InstructionsPage -->|Upload chat| parseChat
        parseChat --> analyzeChat
        analyzeChat --> ChatAnalysisProvider
        ChatAnalysisProvider --> ResultsPage
        ChatAnalysisProvider --> PremiumPage

        ResultsPage -->|Componentes| SenderFocus & ResultCard & ContactBubble & EmojiCloud & TimelineChart & SentimentChart & ShareableImage
        PremiumPage -->|Componentes| SenderFocus & ResultCard & ContactBubble & EmojiCloud & TimelineChart & SentimentChart & ShareableImage

        ResultsPage -->|Hooks| useIsMobile & useToast
        PremiumPage -->|Hooks| useIsMobile & useToast

        PaymentPage -->|MercadoPago SDK| MercadoPago
        PaymentPage -->|Após pagamento| PremiumPage
    end

    subgraph Backend [Firebase Functions]
        callGemini[callGemini (IA Gemini)]
        saveAnalysisResults[saveAnalysisResults]
        getAnalysisResults[getAnalysisResults]
    end

    PremiumPage -->|Chama IA| callGemini
    ResultsPage -->|Chama IA| callGemini
    PremiumPage --> saveAnalysisResults
    ResultsPage --> getAnalysisResults

    InstructionsPage --> AnalyzingPage
    AnalyzingPage --> ResultsPage
    PaymentPage --> PremiumPage
```

---

## Fluxo do Usuário

1. **WelcomePage**: Tela inicial com boas-vindas.
2. **InstructionsPage**: Usuário faz upload do chat.
3. **Parsing**: `parseChat.ts` transforma texto em mensagens estruturadas.
4. **Análise**: `analyzeChat.ts` gera estatísticas e insights.
5. **Contexto**: Dados são armazenados no `ChatAnalysisContext`.
6. **AnalyzingPage**: Tela de carregamento enquanto análise ocorre.
7. **ResultsPage**: Exibe resultados detalhados com gráficos, nuvens de emojis, destaques, etc.
8. **PremiumPage**: Recursos avançados com IA (ex: previsão, poema, análise de estilo).
9. **PaymentPage**: Integração com MercadoPago para compra do premium.
10. **Backend**: Funções Firebase para IA (Gemini), salvar e buscar análises.

---

## Componentes Principais

- **Contexto Global**
  - `ChatAnalysisProvider` e `useChatAnalysis`: gerenciam estado da análise.
- **Libs**
  - `parseChat.ts`: parsing do texto do chat.
  - `analyzeChat.ts`: análise estatística e NLP.
- **Hooks**
  - `useIsMobile`: detecta mobile.
  - `useToast`: gerencia notificações.
- **Componentes Visuais**
  - `SenderFocus`, `ResultCard`, `ContactBubble`, `EmojiCloud`, `TimelineChart`, `SentimentChart`, `ShareableImage`, `AdBanner`, `AnimatedText`, etc.
- **Páginas**
  - `WelcomePage`, `InstructionsPage`, `AnalyzingPage`, `ResultsPage`, `PremiumPage`, `PaymentPage`, `NotFound`.
- **Backend Firebase**
  - `callGemini`: chamadas IA Gemini.
  - `saveAnalysisResults`: salva resultados.
  - `getAnalysisResults`: recupera resultados.

---

## Integrações Externas

- **Firebase**
  - Autenticação, Firestore, Functions.
- **MercadoPago**
  - Processamento de pagamentos.
- **Google Gemini**
  - Geração de texto criativo, análise de estilo, análise de personalidade.

---

## Resumo

O sistema é uma aplicação React com backend serverless no Firebase, que processa chats enviados pelo usuário, realiza análises NLP e IA, e oferece funcionalidades premium mediante pagamento. O frontend é modularizado em páginas, componentes, hooks e contextos, enquanto o backend gerencia chamadas IA e persistência.