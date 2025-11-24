declare module 'nodemailer' {
  export interface SentMessageInfo {
    messageId?: string;
    message?: Buffer | string;
  }

  export interface Transporter {
    sendMail(mailOptions: any): Promise<SentMessageInfo>;
  }

  export function createTransport(options?: any): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
