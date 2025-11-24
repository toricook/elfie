import nodemailer from 'nodemailer';

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const DEFAULT_FROM = 'Secret Santa <no-reply@example.com>';

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

function getFromAddress() {
  return process.env.EMAIL_FROM || DEFAULT_FROM;
}

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function createTransport() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (SMTP_HOST) {
      const port = SMTP_PORT ? Number(SMTP_PORT) : 587;
      const secure = port === 465;

      return nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth:
          SMTP_USER && SMTP_PASS
            ? {
                user: SMTP_USER,
                pass: SMTP_PASS,
              }
            : undefined,
      });
    }

    // Dev fallback: log emails as JSON so local testing still works.
    console.warn('SMTP not configured, using JSON transport for emails');
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  })();

  return transporterPromise;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  const transporter = await createTransport();

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  if (info.messageId) {
    console.log(`Email queued for ${to}: ${info.messageId}`);
  }

  // For JSON transport in dev, dump the message payload.
  if (info.message) {
    console.log('Email JSON:', info.message.toString());
  }
}

export function buildMagicLink(token: string) {
  return `${getBaseUrl()}/verify?token=${token}`;
}

export async function sendMagicLinkEmail(to: string, token: string) {
  const magicLink = buildMagicLink(token);

  await sendEmail({
    to,
    subject: 'Your Secret Santa invite link',
    text: [
      'You have been invited to a Secret Santa game!',
      '',
      `Click this link to join: ${magicLink}`,
      '',
      'If you did not expect this email, you can ignore it.',
    ].join('\n'),
    html: `
      <p>You have been invited to a Secret Santa game!</p>
      <p><a href="${magicLink}" target="_blank" rel="noopener noreferrer">Click here to join</a></p>
      <p>If you did not expect this email, you can ignore it.</p>
    `,
  });

  return magicLink;
}

export async function sendDrawNotificationEmail(to: string, token: string, participantName?: string) {
  const magicLink = buildMagicLink(token);
  const name = participantName || to;

  await sendEmail({
    to,
    subject: 'Secret Santa draw is complete!',
    text: [
      `Hi ${name},`,
      '',
      'The Secret Santa draw has been completed.',
      'Use your magic link below to see who you are gifting:',
      magicLink,
      '',
      'Happy gifting!',
    ].join('\n'),
    html: `
      <p>Hi ${name},</p>
      <p>The Secret Santa draw has been completed.</p>
      <p><a href="${magicLink}" target="_blank" rel="noopener noreferrer">Use your magic link</a> to see who you are gifting.</p>
      <p>Happy gifting!</p>
    `,
  });

  return magicLink;
}
