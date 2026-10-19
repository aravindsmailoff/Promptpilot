// Disables Prisma Client to rely 100% exclusively on Firebase Realtime Database
export const prisma: any = new Proxy({}, {
  get: () => async () => {
    return null;
  }
});
