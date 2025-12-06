import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
interface NotificationRequest {
  deliveryId: string;
  newStatus: string;
  donationTitle: string;
  recipientEmail: string;
  recipientName: string;
}

// Validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Validate email format
const isValidEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str) && str.length <= 255;
};

// Sanitize HTML to prevent injection
const sanitizeHtml = (str: string): string => {
  return str.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return entities[char] || char;
  });
};

// Validate and parse request
const validateRequest = (data: unknown): { valid: true; data: NotificationRequest } | { valid: false; error: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = data as Record<string, unknown>;

  // Validate deliveryId
  if (typeof req.deliveryId !== 'string' || !isValidUUID(req.deliveryId)) {
    return { valid: false, error: 'Invalid deliveryId: must be a valid UUID' };
  }

  // Validate newStatus
  const validStatuses = ['assigned', 'in_transit', 'delivered', 'failed'];
  if (typeof req.newStatus !== 'string' || !validStatuses.includes(req.newStatus)) {
    return { valid: false, error: 'Invalid newStatus: must be one of assigned, in_transit, delivered, failed' };
  }

  // Validate donationTitle
  if (typeof req.donationTitle !== 'string' || req.donationTitle.length === 0 || req.donationTitle.length > 200) {
    return { valid: false, error: 'Invalid donationTitle: must be 1-200 characters' };
  }

  // Validate recipientEmail
  if (typeof req.recipientEmail !== 'string' || !isValidEmail(req.recipientEmail)) {
    return { valid: false, error: 'Invalid recipientEmail: must be a valid email address' };
  }

  // Validate recipientName
  if (typeof req.recipientName !== 'string' || req.recipientName.length === 0 || req.recipientName.length > 100) {
    return { valid: false, error: 'Invalid recipientName: must be 1-100 characters' };
  }

  return {
    valid: true,
    data: {
      deliveryId: req.deliveryId,
      newStatus: req.newStatus,
      donationTitle: sanitizeHtml(req.donationTitle),
      recipientEmail: req.recipientEmail,
      recipientName: sanitizeHtml(req.recipientName),
    },
  };
};

const getStatusMessage = (status: string): { subject: string; message: string } => {
  switch (status) {
    case "assigned":
      return {
        subject: "Delivery Assigned - FoodShare",
        message: "A delivery person has been assigned to pick up your food donation.",
      };
    case "in_transit":
      return {
        subject: "Food is On the Way! - FoodShare",
        message: "Great news! Your food donation is now in transit and on its way.",
      };
    case "delivered":
      return {
        subject: "Delivery Complete - FoodShare",
        message: "Your food donation has been successfully delivered. Thank you for making a difference!",
      };
    case "failed":
      return {
        subject: "Delivery Issue - FoodShare",
        message: "Unfortunately, there was an issue with the delivery. Please check your dashboard for more details.",
      };
    default:
      return {
        subject: "Delivery Status Update - FoodShare",
        message: `Your delivery status has been updated to: ${status}`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send delivery notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Parse and validate input
    const rawData = await req.json();
    const validation = validateRequest(rawData);
    
    if (!validation.valid) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { deliveryId, newStatus, donationTitle, recipientEmail, recipientName } = validation.data;

    // Verify the delivery exists and caller is authorized
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        
        // Check if delivery exists and user is involved
        const { data: delivery, error: deliveryError } = await supabase
          .from('deliveries')
          .select('id')
          .eq('id', deliveryId)
          .single();
        
        if (deliveryError || !delivery) {
          console.error("Delivery not found or unauthorized:", deliveryError);
          return new Response(
            JSON.stringify({ error: "Delivery not found or unauthorized" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }

    console.log(`Processing notification for delivery ${deliveryId}, status: ${newStatus}`);
    console.log(`Sending to: ${recipientEmail}`);

    const { subject, message } = getStatusMessage(newStatus);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
          .donation-title { font-size: 18px; font-weight: 600; color: #1f2937; margin: 20px 0 10px; }
          .message { color: #4b5563; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ FoodShare</h1>
          </div>
          <div class="content">
            <p>Hello ${recipientName},</p>
            <p class="donation-title">Donation: ${donationTitle}</p>
            <p><strong>Status:</strong> <span class="status-badge">${newStatus.replace("_", " ")}</span></p>
            <p class="message">${message}</p>
            <p>Log in to your dashboard to view more details about this delivery.</p>
            <div class="footer">
              <p>Thank you for being part of the FoodShare community!</p>
              <p>Together, we're fighting hunger one meal at a time.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FoodShare <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending delivery notification:", error);
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
