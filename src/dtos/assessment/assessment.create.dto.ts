import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { AssessmentType } from 'src/schema/assessment.schema';
import { ExerciseCreateDto } from '../exercise/exercise.create.dto';

export class AssessmentCreateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description?: string;

  @IsEnum(AssessmentType, {
    message: `Assessment type must be one of the following values: ${Object.values(AssessmentType).join(', ')}.`,
  })
  @IsNotEmpty()
  type: AssessmentType;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  deadline: string;

  @IsNotEmpty()
  @IsInt()
  toleranceTime: number;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsArray()
  exercises: ExerciseCreateDto[];
}
