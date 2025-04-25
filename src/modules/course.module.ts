import { Module } from '@nestjs/common';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { CourseRepository } from 'src/repositories/course.repository';

@Module({
  controllers: [CourseController],
  providers: [CourseService, CourseRepository],
})
export class CourseModule {}
