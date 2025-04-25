import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'beforeExit'>
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
    console.log('Prisma client connected');
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      console.debug('cerrando app');
      await app.close();
    });
  }
}
