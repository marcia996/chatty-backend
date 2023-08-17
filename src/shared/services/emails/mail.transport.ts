import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import Logger from 'bunyan';
import sendGridMail from '@sendgrid/mail';
import { config } from '@root/config';
import { BadRequestError } from '@global/helpers/error-handler';

// nodemailer format
interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const log: Logger = config.createLogger('mailOptions');
sendGridMail.setApiKey(config.SENDGRID_API_KEY!);


class MailTransport
{

 public async sendEmail(receiverEmail:string,subject:string,body:string):Promise<void>
 {
  if(config.NODE_ENV==='test'||config.NODE_ENV==='development')
  {this.developmentEmailSender(receiverEmail,subject,body);}
  else
  {
    this.productionEmailSender(receiverEmail,subject,body);
  }
 }
 private async developmentEmailSender(receiverEmail:string,subject:string,body:string ):Promise<void>
 {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: config.SENDER_EMAIL!,
      pass: config.SENDER_EMAIL_PASSWORD!,
    }
  });

  const mailOptions:IMailOptions=
  {
    from:`Chatty App <${config.SENDER_EMAIL!}>`,
    to:receiverEmail,
    subject,
    html:body
  };


try {

  await transporter.sendMail(mailOptions);
  log.info('Development email sent sunccessfully');
} catch (error) {
   log.error('Error sending email',error);
   throw new BadRequestError('Error sending email');
}

 }
 private async productionEmailSender(receiverEmail:string,subject:string,body:string ):Promise<void>
 {


  const mailOptions:IMailOptions=
  {
    from:`Chatty App <${config.SENDER_EMAIL!}>`,
    to:receiverEmail,
    subject,
    html:body
  };


try {

  await sendGridMail.send(mailOptions);
  log.info('Production email sent successfully');
} catch (error) {
   log.error('Error sending email',error);
   throw new BadRequestError('Error sending email');
}

 }
}

export const mailTransport:MailTransport = new MailTransport();
