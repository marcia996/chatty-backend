
import { Request, Response } from 'express';
import { config } from '@root/config';
import moment from 'moment';
import publicIP from 'ip';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import crypto from 'crypto';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { IAuthDocument } from '@auth/interfaces/auth.interfaces';
import { authService } from '@services/db/auth.service';
import { forgetPasswordTemplate } from '@services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@services/queues/email.queue';
import { resetPasswordTemplate } from '@services/emails/templates/reset-password/reset-password-template';



export class Password{

@joiValidation(emailSchema)
public async create(req:Request,res:Response):Promise<void>
{
  // get email
  // req.body???
  const {email}=req.body;
  const existingUser:IAuthDocument= await authService.getAuthUserbyEmail(email);
  // whether the user with particular email exist
  if(!existingUser)
  {
    throw new BadRequestError('user does not exist for this email');
  }
   // crypto covert buffer to string 20字节的随机数据
  const randomBytes:Buffer= await Promise.resolve(crypto.randomBytes(20));
  // 将随机字节转换成16进制字符串
  const randomCharacters:string= randomBytes.toString('hex');
  // one hour
  await authService.updatePasswordToken(`${existingUser._id!}`,randomCharacters,Date.now()*60*60*1000);

  const resetLink=`${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
  const template:string= forgetPasswordTemplate.passwordResetTemplate(existingUser.username!,resetLink);
  // 'forgetPassword' exactly match with the process job'
  emailQueue.addEmailJob('forgetPasswordEmail',{template,receiverEmail:email,subject:'reset your password'});
  res.status(HTTP_STATUS.OK).json({message:'Password reset email sent'});
}



@joiValidation(passwordSchema)
public async update(req:Request,res:Response):Promise<void>
{
  const {password,confirmPassword}=req.body;
  const{token}=req.params;
  if(password!==confirmPassword)
  {
    throw new BadRequestError('Passwords do not match');
  }

  const existingUser:IAuthDocument= await authService.getAuthUserByPasswordToken(token);
  if(!existingUser)
  {
    throw new BadRequestError('Reset token has expired');
  }

  existingUser.password=password;
  existingUser.passwordResetExpires=undefined;
  existingUser.passwordResetToken=undefined;

  await existingUser.save();


  const templateParams: IResetPasswordParams = {
    username: existingUser.username!,
    email: existingUser.email!,
    ipaddress: publicIP.address(),
    date: moment().format('DD//MM//YYYY HH:mm')
  };
  const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
  emailQueue.addEmailJob('changePassword', { template, receiverEmail: existingUser.email!, subject: 'Password Reset Confirmation' });
  res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated.' });

}
}






