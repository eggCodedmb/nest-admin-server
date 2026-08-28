import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in standard response structure, return as is
        if (data && typeof data === 'object' && 'code' in data && 'message' in data && 'data' in data) {
          return {
            ...data,
            timestamp: data.timestamp || Date.now(),
          };
        }
        return {
          code: 200,
          message: '操作成功',
          data: data ?? null,
          timestamp: Date.now(),
        };
      }),
    );
  }
}
