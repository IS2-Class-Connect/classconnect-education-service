import { Module } from '@nestjs/common';
import { CourseModule } from './modules/course.module';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [PrismaModule, CourseModule],
})
export class AppModule {}
