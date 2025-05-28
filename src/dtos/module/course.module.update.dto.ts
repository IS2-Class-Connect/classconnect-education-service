import { PartialType } from '@nestjs/mapped-types';
import { CourseModuleCreateDto } from './course.module.create.dto';
import { IsUUID } from 'class-validator';

export class CourseModuleUpdateDto extends PartialType(CourseModuleCreateDto) {
  /** Id of the user who generate the PATCH */
  @IsUUID()
  userId: string;
}
