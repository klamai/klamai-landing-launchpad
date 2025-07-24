import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.0";

Deno.serve(async (req: Request) => {
  if (req.method === 'POST') {
    const { to, subject, text } = await req.json();

    // Create a transporter object using Gmail's SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: Deno.env.get('GMAIL_USER'), // Your Gmail address
        pass: Deno.env.get('GMAIL_PASS'), // Your Gmail password or app password
      },
    });

    // Set up email data
    const mailOptions = {
      from: Deno.env.get('GMAIL_USER'),
      to,
      subject,
      text,
    };

    // Send mail
    try {
      await transporter.sendMail(mailOptions);
      return new Response(JSON.stringify({ message: 'Email sent successfully!' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
});