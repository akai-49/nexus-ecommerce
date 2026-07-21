import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;
    const userAgent = request.headers['user-agent'];

    // Track mutations only: POST, PUT, PATCH, DELETE
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap({
        next: async () => {
          if (isMutation && !url.includes('auth/login')) {
            const userId = user?.id || null;
            const action = `${method} ${url}`;

            // Sanitize body to avoid logging passwords
            const sanitizedBody = { ...body };
            delete sanitizedBody.password;
            delete sanitizedBody.passwordHash;

            try {
              await this.prisma.auditLog.create({
                data: {
                  userId,
                  action,
                  ipAddress: ip,
                  userAgent,
                  details: sanitizedBody,
                },
              });
            } catch (err) {
              console.error('Failed to save audit log:', err);
            }
          }
        },
      }),
    );
  }
}
