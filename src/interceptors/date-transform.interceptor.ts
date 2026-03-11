import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class DateTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const timezone =
      request.headers['x-timezone'] || request.headers['time-zone'] || 'UTC'

    return next.handle().pipe(map((data) => this.transformDates(data, timezone)))
  }

  private transformDates(obj: any, timezone: string): any {
    if (obj === null || obj === undefined) return obj

    if (obj instanceof Date) {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZoneName: 'short',
        }).format(obj)
      } catch {
        return obj.toISOString()
      }
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformDates(item, timezone))
    }

    if (typeof obj === 'object') {
      const transformed: any = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          transformed[key] = this.transformDates(obj[key], timezone)
        }
      }
      return transformed
    }

    return obj
  }
}
