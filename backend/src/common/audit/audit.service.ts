import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type AnyRecord = Record<string, unknown>;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  recordCreate(entity: string, entityId: string, after: AnyRecord) {
    return this.prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action: AuditAction.CREATE,
        changes: this.serialize({ after }),
      },
    });
  }

  recordUpdate(
    entity: string,
    entityId: string,
    before: AnyRecord,
    after: AnyRecord,
  ) {
    const diff = this.diff(before, after);
    if (Object.keys(diff).length === 0) return;
    return this.prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action: AuditAction.UPDATE,
        changes: this.serialize({ before: diff.before, after: diff.after }),
      },
    });
  }

  recordDelete(entity: string, entityId: string, before: AnyRecord) {
    return this.prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action: AuditAction.DELETE,
        changes: this.serialize({ before }),
      },
    });
  }

  private diff(before: AnyRecord, after: AnyRecord) {
    const beforeDiff: AnyRecord = {};
    const afterDiff: AnyRecord = {};
    const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      if (!this.equal(before[key], after[key])) {
        beforeDiff[key] = before[key];
        afterDiff[key] = after[key];
      }
    }
    return { before: beforeDiff, after: afterDiff };
  }

  private equal(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if (this.isDecimalLike(a) && this.isDecimalLike(b)) {
      return String(a) === String(b);
    }
    return false;
  }

  private isDecimalLike(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { toFixed?: unknown }).toFixed === 'function'
    );
  }

  private serialize(value: AnyRecord): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value, (_key, v) => {
        if (v instanceof Date) return v.toISOString();
        if (this.isDecimalLike(v)) return String(v);
        return v;
      }),
    ) as Prisma.InputJsonValue;
  }
}
