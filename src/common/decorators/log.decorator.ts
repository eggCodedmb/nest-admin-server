import { SetMetadata } from '@nestjs/common';
import { BusinessType } from '../constants/system.constants';

export const OPER_LOG_KEY = 'OPER_LOG';

export interface LogOptions {
  title: string;
  businessType?: BusinessType;
  isSaveRequestData?: boolean;
  isSaveResponseData?: boolean;
}

export const Log = (options: LogOptions) => SetMetadata(OPER_LOG_KEY, options);
