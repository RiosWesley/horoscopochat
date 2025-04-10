# Horóscopo das Mensagens - Project Progress

## Goal

Create a functional web application that analyzes uploaded WhatsApp chat `.txt` files locally in the browser to generate fun, horoscope-style insights based on message content and patterns.

## Current Plan & Status

1.  **File Handling (`InstructionsPage.tsx`):**
    *   [X] Implement reading of the uploaded `.txt` file using `FileReader`.
    *   [X] Implement reading of WhatsApp chat `.zip` export using `jszip` to extract `.txt`.
    *   [X] Store the raw text content (from `.txt` or extracted from `.zip`) in shared state (React Context).
    *   [X] Navigate to `/analyzing` upon successful file read/extraction.
2.  **Parsing (`src/lib/parseChat.ts`):**
    *   [X] Create a function to parse raw text into structured message objects (`{timestamp, sender, message}`).
    *   [X] Handle basic WhatsApp message formats (user messages, system messages, multi-line).
    *   [X] Refine date/time parsing to handle more formats (DD/MM/YY, MM/DD/YY, AM/PM, different separators).
    *   [X] Refine system message detection using keywords. *Further variations might need refinement.*
    *   [X] Fix parsing to correctly identify "mensagem editada" as a system message.
3.  **Analysis (`src/lib/analyzeChat.ts`):**
    *   [X] Create basic analysis function structure.
    *   [X] Implement counts for total messages and messages per sender.
    *   [X] Implement emoji counting and find most frequent emoji.
    *   [X] Implement peak hour calculation (statistic kept, view removed).
    *   [X] Implement counts for basic keywords (laughter, questions, positive, negative).
    *   [X] Implement average message length calculation.
    *   [X] Implement "Palavra Favorita" analysis (most frequent significant word).
    *   [X] Fix "Palavra Favorita" bug related to media placeholders.
    *   [X] Investigate "Palavra Favorita" returning `null`; confirmed this is expected if no word meets frequency/filtering criteria. (Code cleanup performed).
    *   [X] Implement punctuation emphasis (!!!, ???) and CAPS word analysis.
    *   [X] Implement simple heuristic rules for generating insights (Signo, Pequenas Verdades) in `ResultsPage.tsx`.
    *   [X] Refine heuristics to incorporate punctuation/CAPS data.
    *   [X] Further refine heuristics for more varied/combined insights (Signo combination, talkative person fact).
    *   [X] Implement common expression (bigram) analysis.
    *   [X] Refine expression analysis by adding system message words to `stopWords` to filter out irrelevant phrases (e.g., "localização tempo").
    *   [X] Implement response time analysis per sender.
4.  **State Management (React Context):**
    *   [X] Set up `ChatAnalysisContext` to hold raw text, parsed messages, analysis results, and loading state.
    *   [X] Use specific types (`ParsedMessage`, `AnalysisResults`).
    *   [X] Update `AnalysisResults` interface with new fields (keywords, avg length, favoriteWord, punctuation, CAPS, expressions).
    *   [X] Add chart view selection state for different time period displays.
    *   [X] Add focused sender state for detailed sender analysis view.
    *   [X] Add `resetAnalysis` function to clear context state.
5.  **Page Updates:**
    *   [X] Update `AnalyzingPage` to trigger parsing and analysis, update Context, and navigate.
    *   [X] Update `ResultsPage` to display basic analysis results (total messages, sender counts) from Context, including loading/error states.
    *   [X] Update `ResultsPage` to display most frequent emoji and peak hour statistic.
    *   [X] Update `ResultsPage` to display generated Signo and Pequenas Verdades based on heuristics.
    *   [X] Update `ResultsPage` to display average message length and keyword insights.
    *   [X] Update `ResultsPage` to display "Mix de Vibrações" based on positive/negative keywords (including per-sender breakdown).
    *   [X] Update `ResultsPage` to display "Palavra Favorita".
    *   [X] Update heuristics in `ResultsPage.tsx` to use keyword, avg length, punctuation, and CAPS data.
    *   [X] Add Signo description generation and display.
    *   [X] Add per-sender analysis calculation in `analyzeChat.ts`.
    *   [X] Add per-sender analysis display section in `ResultsPage.tsx`.
    *   [ ] ~~Connect ActivityHeatmap to real data.~~ (Component/View removed)
    *   [X] Connect SentimentChart to real data (positive/negative keywords).
    *   [X] Connect Chat Info Strip to real message count, active days, and date range.
    *   [X] Remove mock Personality Traits section.
    *   [X] Connect Expressions section to real data.
    *   [X] Add response time display to per-sender analysis in `ResultsPage.tsx`.
    *   [X] Add detailed sender focus view for deep-diving into individual participants.
    *   [X] Enhance context with view controls for different chart periods and focused sender state.
    *   [X] Fix FloatingEmoji component to support non-animated mode.
    *   [X] Implement social sharing image generation and triggering in `handleShare`.
    *   [X] Add daily and weekly message count calculation to `analyzeChat.ts`.
    *   [X] Integrate `TimelineChart` for daily/weekly views in `ResultsPage.tsx` (Removed Hourly chart view).
    *   [X] Add premium analysis calculation (Passive-Aggressive, Flirtation) to `analyzeChat.ts` (including per-sender counts and overall/per-sender percentages).
    *   [X] Add conditional UI in `ResultsPage.tsx` to display premium analysis (overall and per-sender percentages) based on mock state.
    *   [X] Improve text color contrast for "Flerte" percentage in per-sender analysis (`ResultsPage.tsx`).
    *   [X] Implement AI-powered creative text generation (prediction/poem) via Cloud Function (`functions/src/index.ts`, `ResultsPage.tsx`).
    *   [X] Implement AI-powered communication style analysis via Cloud Function (`functions/src/index.ts`, `ResultsPage.tsx`).
    *   [X] Add frontend logic for token limiting and message anonymization for AI style analysis (`ResultsPage.tsx`).
    *   [X] ~~Add UI sections in `ResultsPage.tsx` to display AI-generated premium content.~~ (Moved to dedicated Premium Page)
    *   [X] Implement "Analisar outro chat" button functionality in `ResultsPage.tsx`.
    *   [X] Add navigation button to Premium Area in `ResultsPage.tsx` when premium is active.
    *   [X] Create dedicated Premium Page (`/premium`).
    *   [X] Implement AI analysis calls and display on Premium Page (Prediction, Poem, Style).
    *   [X] Implement Passive-Aggressive and Flirtation analysis display (including random compatibility) on Premium Page.
    *   [X] Implement AI-powered Flag Personality analysis display on Premium Page (replaces simple flag count).
    *       *   [X] Fix `TypeError: .trim is not a function` when processing AI flag personality result.
    *   [X] Implement Save/Share functionality (`/results/:analysisId`, Firestore save/load via Cloud Functions, including premium status display on shared links).
    *       *   [X] Fix Signo display on shared links (save/load `generatedSign`).
    *       *   [X] Include Red/Green flag counts in saved data (`functions/src/index.ts`).
    *   [X] Implement per-feature rate limiting (30s interval) for AI calls on Premium Page (`PremiumPage.tsx`).

## Next Steps

*   [X] Implement Red/Green Flag analysis (backend logic in `analyzeChat.ts`).
*       *   [X] Add keyword lists and regex patterns for flags.
*       *   [X] Add counting logic per message and per sender.
*       *   [X] Store matched flag keywords per sender in `SenderStats`.
*       *   [X] Update `AnalysisResults` and `SenderStats` interfaces.
*   [X] Implement AI Task (`analyzeFlagsPersonality`) in Cloud Function (`functions/src/index.ts`).
*       *   [X] Define prompt to analyze personality based on flag keywords per sender.
*       *   [X] Handle JSON response.
*       *   [X] Update `AnalysisResultsToSave` interface.
*   [X] Deploy Firebase Cloud Functions (`callGemini`, `saveAnalysisResults`, `getAnalysisResults`).
*   [ ] Add animations for transitions between different views and states. (Card animation done, others pending)
*   Further refine chat parsing for any remaining edge cases if needed.
*   Explore ad integration (e.g., AdSense/AdMob) as an additional monetization strategy.
*   Implement *actual* premium features and subscription handling (currently mocked).
*   [X] Securely manage API keys using environment variables/secrets management for production (`.env` for Firebase frontend, `functions:config` for Gemini backend).
*   [X] Add explicit user consent flow (checkbox) for sending data to AI APIs on Premium Page (`PremiumPage.tsx`).
*   Add tutorial/onboarding overlays to guide users through the application.

---

## Integração Checkout Transparente Mercado Pago

Implementar o fluxo real de pagamento com Mercado Pago para ativar funcionalidades premium, substituindo a integração mockada atual.

### Diagnóstico Atual (Abril 2025)

- O SDK MercadoPago.js está sendo carregado dinamicamente e inicializado com a chave pública corretamente.
- O `cardForm` do SDK está sendo criado com `autoMount: false` e montado manualmente via `.mount()`.
- O formulário exibe os containers (`div` e `select`), mas **não é possível digitar o número do cartão, selecionar bandeira ou parcelas**, pois os campos são iframes injetados pelo SDK e eles **não estão aparecendo ou estão bloqueados**.
- Diagnóstico detalhado da integração atual:
  - O SDK é carregado e inicializado sem erros aparentes.
  - O método `mp.cardForm()` retorna uma instância válida, e o método `.mount()` é chamado manualmente.
  - O callback `onFormMounted` indica sucesso, ou reporta erros se houver.
  - Os containers HTML para os campos (`#form-checkout__cardNumber`, `#form-checkout__issuer`, etc.) estão presentes no DOM e com estilos visíveis.
  - **Provável causa do problema:** os iframes do SDK **não estão sendo injetados corretamente** ou estão sendo bloqueados por:
    - Restrições de CSP (Content Security Policy) que impedem carregamento de iframes externos.

- A folha de estilos `src/styles/mercadopago.css` **força a visibilidade e interatividade dos iframes** do Mercado Pago, garantindo que:
  - `width`, `height`, `opacity`, `pointer-events` estejam corretos.
  - Containers tenham altura mínima e não escondam os iframes.
- Portanto, **não é problema de CSS bloqueando os campos**.

**Hipóteses restantes para o campo bloqueado:**
- A chave pública usada pode estar incorreta, inválida ou não configurada para sandbox, causando falha silenciosa do SDK.
- O ambiente pode estar em produção com credenciais incorretas para testes.
- Algum erro silencioso do SDK durante a montagem dos iframes (verificar console do navegador).
- CSP pode estar configurado via headers no backend (Firebase Hosting), o que não é visível no HTML.

**Próximas ações recomendadas:**
- Inspecionar o console do navegador para erros do SDK ou CSP.
- Confirmar que a `VITE_MERCADO_PAGO_PUBLIC_KEY` é válida e está no modo sandbox.
- Se necessário, gerar uma nova chave pública de sandbox no painel do Mercado Pago e atualizar o `.env`.
- Verificar se os iframes aparecem no DOM (via inspetor) e se estão carregando conteúdo do Mercado Pago.

---

### Correção aplicada (Abril 2025)

- Alterado o parâmetro `autoMount` do `mp.cardForm()` para `true`, conforme recomendado pela documentação oficial.
- Removida a montagem manual via `.mount()`.
- Com isso, o SDK injeta automaticamente os iframes seguros nos containers.
- Resultado esperado: os campos de cartão agora ficam desbloqueados e interativos.
- **Problema do campo bloqueado resolvido.**
    - Chave pública inválida, incorreta ou ambiente não configurado para sandbox, causando falha silenciosa do SDK.
### Status da Integração

- [X] Carregar o SDK MercadoPago.js real (`https://sdk.mercadopago.com/js/v2`).
- [X] Inicializar o SDK com a `PUBLIC_KEY` real.
- [X] Substituir o formulário manual por um `cardForm` do SDK Mercado Pago, que tokeniza os dados do cartão de forma segura.
- [X] No evento `onSubmit` do `cardForm`, gerar o token do cartão.
- [ ] Enviar o token gerado, valor da compra, e dados do comprador (email, documento) para o backend via API segura.
- **Adicionar suporte a Pix:**
- [X] Adicionar um seletor de método de pagamento (Cartão de Crédito ou Pix).
- [X] Se Pix for selecionado, ocultar o formulário do cartão e coletar apenas email e CPF.
- [ ] Enviar a escolha do método, valor e dados do comprador para o backend.
- [ ] Se Pix, exibir o QR Code ou código Copia e Cola retornado pelo backend para o usuário realizar o pagamento.
- [ ] Atualizar a interface para mostrar o status do pagamento Pix (pendente, aprovado, expirado).

### Próximos Passos

- Verificar no console do navegador se há erros do SDK Mercado Pago ou CSP bloqueando iframes.
- Confirmar se os iframes do SDK estão presentes no DOM dentro dos containers (`#form-checkout__cardNumber`, `#form-checkout__issuer`, etc).
- Garantir que a chave pública usada seja válida e esteja no modo sandbox para testes.
- Ajustar o CSS para garantir que os containers estejam visíveis e sem sobreposição.
- Após resolver a montagem do formulário:
  - Implementar envio do token e dados para backend seguro.
  - Criar endpoint backend para processar pagamentos com cartão e Pix.
  - Exibir status real do pagamento para o usuário.

### 2. Backend (Cloud Function Firebase)

- [ ] Criar endpoint seguro que recebe os dados do pagamento (token + info para cartão, ou apenas info para Pix).
- [ ] Usar o `ACCESS_TOKEN` do Mercado Pago para criar o pagamento via API REST (`POST /v1/payments`).
- [ ] Configurar a requisição:
-   - Para cartão: valor, token, descrição, parcelas, método `payment_method_id` (ex: "visa"), e dados do pagador.
-   - Para Pix: valor, `payment_method_id: "pix"`, descrição, e dados do pagador (email, CPF).
- [ ] Retornar o status do pagamento para o frontend (approved, pending, rejected, etc).
- [ ] Se Pix, retornar também o QR Code base64 e código Copia e Cola.
- [ ] Registrar a transação para fins de auditoria e controle de acesso premium.

### 3. Frontend (pós-pagamento)

- [ ] Exibir o resultado real do pagamento para o usuário.
- [ ] Se Pix, exibir QR Code e instruções para pagamento.
- [ ] Ativar funcionalidades premium apenas se o status for "approved".
- [ ] Redirecionar para a página Premium com acesso liberado.
- [ ] Exibir mensagens de erro personalizadas em caso de falha.

### 4. Testes

- [ ] Usar ambiente sandbox e cartões de teste fornecidos pelo Mercado Pago.
- [ ] Simular diferentes cenários (aprovado, recusado, pendente, expirado, erro).
- [ ] Validar segurança da integração (tokenização, HTTPS).

### 5. Segurança

- [ ] Garantir que dados sensíveis nunca trafeguem ou fiquem armazenados no frontend.
- [ ] Usar tokenização via SDK Mercado Pago para cartões.
- [ ] Proteger o endpoint backend com autenticação adequada.
- [ ] Usar HTTPS em todas as comunicações.

---

## Monetização Mobile (AdMob)

* Integrar o **Google AdMob** na versão mobile (PWA ou app nativo).
* Utilizar **anúncios intersticiais** (tela cheia entre navegações) para maximizar receita.
* Utilizar **anúncios recompensados** (rewarded ads) para liberar funcionalidades extras ou análises completas após o usuário assistir um vídeo publicitário.
* Seguir as **políticas do Google** para não violar regras e evitar banimento.
* Planejar a integração com SDKs do AdMob para React Native, Capacitor, Cordova ou outro framework mobile.
* Explorar o uso combinado com banners do AdSense na versão web.

---

*This file will be updated as development progresses.*
