import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import crypto from "crypto";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const createPayment = functions.https.onRequest(async (req, res) => {
  const allowedOrigins = [
    'https://horoscopozap.web.app',
    'http://localhost:8080'
  ];

  const origin = req.headers.origin as string | undefined;

  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const {
      token,
      payment_method_id,
      issuer_id,
      email,
      identificationType,
      identificationNumber,
      transaction_amount,
      installments,
      description,
      analysisId
    } = req.body;

    if (!token || !payment_method_id || !email || !identificationType || !identificationNumber || !transaction_amount || !installments || !description || !analysisId) {
      console.warn("Validation Error: Missing required fields in request body.", req.body);
      res.status(400).json({ error: "Dados obrigatórios ausentes" });
      return;
    }

    const accessToken = functions.config().mercadopago?.accesstoken;
    if (!accessToken) {
      console.error("Configuration Error: Mercado Pago access token not found in Firebase config.");
      res.status(500).json({ error: "Erro interno de configuração do servidor." });
      return;
    }

    const paymentPayload = {
      transaction_amount: Number(transaction_amount),
      token,
      description,
      installments: Number(installments),
      payment_method_id,
      issuer_id,
      payer: {
        email,
        identification: {
          type: identificationType,
          number: identificationNumber
        }
      }
    };

    console.log("Sending payment request to Mercado Pago...");
    const idempotencyKey = crypto.randomUUID();

    const responseMP = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentResult = await responseMP.json();

    console.log("Mercado Pago Response Status:", responseMP.status);
    console.log("Mercado Pago Response Body:", paymentResult);

    if (!responseMP.ok) {
      console.error(`Mercado Pago API error (${responseMP.status}):`, paymentResult);
      const clientErrorMessage = paymentResult?.message || `Falha ao processar o pagamento com Mercado Pago.`;
      const clientStatus = responseMP.status >= 500 ? 502 : 400;
      res.status(clientStatus).json({
        error: clientErrorMessage,
        mp_status: paymentResult?.status,
        mp_status_detail: paymentResult?.status_detail
      });
      return;
    }

    const isApproved = paymentResult.status === "approved";

    try {
      const analysisUpdateData: { [key: string]: any } = {
        paymentStatus: paymentResult.status,
        paymentDetail: paymentResult.status_detail,
        paymentId: paymentResult.id,
      };
      if (isApproved) {
        analysisUpdateData.isPremiumAnalysis = true;
      }
      await admin.firestore().collection("sharedAnalyses").doc(analysisId).update(analysisUpdateData);
      console.log(`Analysis ${analysisId} updated in Firestore. Payment Approved: ${isApproved}`);
    } catch (firestoreError) {
      console.error(`CRITICAL: Firestore update failed for analysis ${analysisId} after payment processing (Payment ID: ${paymentResult.id}, Status: ${paymentResult.status}). Error:`, firestoreError);
    }

    res.status(200).json({
      success: isApproved,
      status: paymentResult.status,
      detail: paymentResult.status_detail,
      paymentId: paymentResult.id,
      message: isApproved
        ? "Pagamento aprovado com sucesso."
        : `Pagamento ${paymentResult.status}. ${paymentResult.status_detail}`
    });

  } catch (error) {
    console.error("Internal Server Error in createPayment:", error);
    res.status(500).json({ error: "Erro interno do servidor ao processar a solicitação de pagamento." });
  }
});