import { PartialType } from '@nestjs/mapped-types';
import { CourseRequestDto } from './course.request.dto';

export class CourseUpdateDto extends PartialType(CourseRequestDto) {
  /** Id of the user who generate the PATCH */
  userId: string;
}
