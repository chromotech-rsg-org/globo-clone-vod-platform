import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegistrationNotificationRequest {
  userEmail: string;
  userName: string;
  auctionName: string;
  status: string;
  clientNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, auctionName, status, clientNotes }: RegistrationNotificationRequest = await req.json();

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'approved':
          return { subject: 'Habilitação Aprovada', message: 'Sua habilitação foi aprovada!' };
        case 'rejected':
          return { subject: 'Habilitação Rejeitada', message: 'Infelizmente sua habilitação foi rejeitada.' };
        default:
          return { subject: 'Status da Habilitação Atualizado', message: 'O status da sua habilitação foi atualizado.' };
      }
    };

    const { subject, message } = getStatusMessage(status);

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
            <p><strong>Leilão:</strong> ${auctionName}</p>
            <p><strong>Status:</strong> ${status === 'approved' ? 'Aprovada' : status === 'rejected' ? 'Rejeitada' : 'Atualizada'}</p>
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

    console.log("Registration notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-notification function:", error);
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