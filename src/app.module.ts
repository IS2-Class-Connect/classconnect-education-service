import { Module } from '@nestjs/common';
import { CourseModule } from './modules/course.module';

@Module({
  imports: [CourseModule],
})
export class AppModule {}
