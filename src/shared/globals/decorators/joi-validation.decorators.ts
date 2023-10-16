import { JoiRequestValidationError } from '../helpers/error-handler';
import { Request } from 'express';
import { ObjectSchema } from 'joi';

// DATA VALIDATION

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IjoiDecorator = (target: any, key: string, descriptor: PropertyDescriptor) => void;

export function joiValidation(schema: ObjectSchema): IjoiDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    // req,res,next
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];

      console.log(req.body);
      // review await promise
      const { error } = await Promise.resolve(schema.validate(req.body));

      console.log(error);
      // ?.
      if (error?.details) {
        console.log(error?.details);
        throw new JoiRequestValidationError(error.details[0].message);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
