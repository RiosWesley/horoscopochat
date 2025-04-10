"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.createPayment = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Método não permitido" });
        return;
    }
    try {
        const { token, payment_method_id, issuer_id, email, identificationType, identificationNumber, transaction_amount, installments, description, analysisId } = req.body;
        if (!token || !payment_method_id || !email || !identificationType || !identificationNumber || !transaction_amount || !installments || !description || !analysisId) {
            res.status(400).json({ error: "Dados obrigatórios ausentes" });
            return;
        }
        const accessToken = functions.config().mercadopago?.accesstoken;
        if (!accessToken) {
            res.status(500).json({ error: "Access Token do Mercado Pago não configurado" });
            return;
        }
        const paymentPayload = {
            transaction_amount,
            token,
            description,
            installments,
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
        const responseMP = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(paymentPayload)
        });
        const paymentResult = await responseMP.json();
        console.log("Resposta Mercado Pago:", paymentResult);
        if (paymentResult.status === "approved") {
            try {
                await admin.firestore().collection("sharedAnalyses").doc(analysisId).update({
                    isPremiumAnalysis: true
                });
                console.log(`Análise ${analysisId} marcada como premium.`);
            }
            catch (err) {
                console.error("Erro ao atualizar Firestore:", err);
            }
        }
        const success = paymentResult.status === "approved";
        res.status(200).json({
            success,
            status: paymentResult.status,
            detail: paymentResult.status_detail,
            message: success
                ? "Pagamento aprovado com sucesso."
                : "Pagamento não aprovado. Tente novamente ou use outro método."
        });
        return;
        res.status(200).json({ message: "Recebido com sucesso. Processamento pendente." });
        return;
    }
    catch (error) {
        console.error("Erro na createPayment:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
        return;
    }
});
//# sourceMappingURL=createPayment.js.map