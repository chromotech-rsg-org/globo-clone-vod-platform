import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type?: 'registration' | 'bid_update';
  userEmail: string;
  userName: string;
  auctionName: string;
  status: string;
  clientNotes?: string;
  bidValue?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'registration', userEmail, userName, auctionName, status, clientNotes, bidValue }: NotificationRequest = await req.json();

    const getStatusMessage = (type: string, status: string) => {
      if (type === 'bid_update') {
        switch (status) {
          case 'approved':
            return { subject: 'Lance Aprovado', message: 'Seu lance foi aprovado!' };
          case 'rejected':
            return { subject: 'Lance Rejeitado', message: 'Infelizmente seu lance foi rejeitado.' };
          default:
            return { subject: 'Status do Lance Atualizado', message: 'O status do seu lance foi atualizado.' };
        }
      }
      
      switch (status) {
        case 'approved':
          return { subject: 'Habilitação Aprovada', message: 'Sua habilitação foi aprovada!' };
        case 'rejected':
          return { subject: 'Habilitação Rejeitada', message: 'Infelizmente sua habilitação foi rejeitada.' };
        default:
          return { subject: 'Status da Habilitação Atualizado', message: 'O status da sua habilitação foi atualizado.' };
      }
    };

    const { subject, message } = getStatusMessage(type, status);

    const emailResponse = await resend.emails.send({
      from: "Leilões <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${subject} - ${auctionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${subject}</h1>
          <p>Olá ${userName},</p>
          <p>${message}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes:</h3>
            <p><strong>${type === 'bid_update' ? 'Leilão' : 'Leilão'}:</strong> ${auctionName}</p>
            ${type === 'bid_update' && bidValue ? `<p><strong>Valor do Lance:</strong> R$ ${bidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
            <p><strong>Status:</strong> ${status === 'approved' ? (type === 'bid_update' ? 'Aprovado' : 'Aprovada') : status === 'rejected' ? (type === 'bid_update' ? 'Rejeitado' : 'Rejeitada') : 'Atualizado'}</p>
          </div>
          ${clientNotes ? `
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3 style="margin-top: 0; color: #1976d2;">Observação:</h3>
              <p style="margin-bottom: 0;">${clientNotes}</p>
            </div>
          ` : ''}
          <p>Atenciosamente,<br>Equipe de Leilões</p>
        </div>
      `,
    });

    console.log("Notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);