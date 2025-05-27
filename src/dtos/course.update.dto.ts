import { PartialType } from '@nestjs/mapped-types';
import { CourseRequestDto } from './course.request.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class CourseUpdateDto extends PartialType(CourseRequestDto) {
  /** Id of the user who generate the PATCH */
  @IsNotEmpty()
  @IsString()
  userId: string;
}
