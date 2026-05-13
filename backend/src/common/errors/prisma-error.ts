import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function rethrowConflict(
  err: unknown,
  message: (target: string[]) => string,
): never {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    const target = Array.isArray(err.meta?.target)
      ? (err.meta?.target as string[])
      : [];
    throw new ConflictException(message(target));
  }
  throw err as Error;
}
