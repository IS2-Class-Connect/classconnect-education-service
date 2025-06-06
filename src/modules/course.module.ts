import { Module } from '@nestjs/common';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { CourseRepository } from 'src/repositories/course.repository';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Module({
  controllers: [CourseController],
  providers: [
    CourseService,
    {
      provide: GoogleGenerativeAI,
      useFactory: () => {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set');
        }
        return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      },
    },
    CourseRepository,
  ],
})
export class CourseModule {}
