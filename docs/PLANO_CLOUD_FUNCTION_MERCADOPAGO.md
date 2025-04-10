# Plano de Implementação - Cloud Function Mercado Pago

## Objetivo

Implementar uma Cloud Function segura que:

- Receba os dados do pagamento do frontend (token do cartão, valor, dados do comprador, analysisId)
- Crie um pagamento real via API do Mercado Pago
- Atualize o Firestore **apenas se o pagamento for aprovado**
- Retorne o status do pagamento para o frontend

---

## Fluxo Geral

1. Frontend coleta dados e tokeniza o cartão com o SDK Mercado Pago
2. Frontend envia token + dados do comprador + analysisId para a Cloud Function
3. Cloud Function cria o pagamento via API Mercado Pago
4. Se aprovado, Cloud Function atualiza `isPremiumAnalysis: true` no Firestore
5. Cloud Function retorna status para o frontend
6. Frontend libera premium **apenas se status for aprovado**

---

## Passos Detalhados

### 1. Criar endpoint HTTPS na Cloud Function para `/create-payment`
**Status:** Pronto (10/04/2025)

### 2. Receber no body:
- token do cartão
- payment_method_id
- issuer_id (opcional)
- email
- identificationType
- identificationNumber
- transaction_amount
- installments
- description
- analysisId
**Status:** Pronto (10/04/2025)

### 3. Validar dados recebidos
**Status:** Pronto (10/04/2025)

### 4. Fazer POST para `https://api.mercadopago.com/v1/payments` com Access Token privado
**Status:** Pronto (10/04/2025)

### 5. Analisar resposta da API Mercado Pago
- Se `status === 'approved'`
  - Atualizar Firestore: `isPremiumAnalysis: true` para o `analysisId`
- Senão
  - Não alterar Firestore
**Status:** Pronto (10/04/2025)

### 6. Retornar para o frontend:
- status do pagamento (`approved`, `rejected`, etc.)
- mensagem adequada
**Status:** Pronto (10/04/2025)

### 7. Testar com cartões de teste no ambiente sandbox
**Status:** Pendente

**Instruções para teste:**

- Use os **cartões de teste** fornecidos pelo Mercado Pago:
  - Visa: `4235 6477 8001 1234`
  - MasterCard: `5031 7557 3453 0604`
  - Data de validade: qualquer data futura
  - CVV: qualquer código de 3 dígitos
  - Nome: qualquer nome
  - CPF: `19119119100` (teste)
- Realize pagamentos no ambiente sandbox.
- Verifique se:
  - O pagamento só é aprovado com cartões válidos de teste.
  - O campo `isPremiumAnalysis` no Firestore só é atualizado quando o pagamento for aprovado.
  - O frontend recebe o status correto e libera o premium apenas quando aprovado.

---

## Checklist de Implementação

- [ ] Criar endpoint HTTPS `/create-payment`
- [ ] Receber e validar dados do pagamento
- [ ] Integrar com API Mercado Pago (Access Token privado)
- [ ] Atualizar Firestore somente se pagamento aprovado
- [ ] Retornar status para frontend
- [ ] Testar integração completa

---

## Notas Importantes

- **Nunca** expor o Access Token privado no frontend
- Usar ambiente sandbox para testes
- Atualizar o campo `isPremiumAnalysis` **apenas via backend**
- O frontend deve liberar premium **somente se status retornado for `approved`**

---

## Histórico de Atualizações

- 10/04/2025 - Documento criado com plano inicial