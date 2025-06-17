import { Equals, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ExerciseType } from 'src/schema/exercise.schema';

interface BaseExercise {
  type: ExerciseType;
  question: string;
  link?: string;
}

export class WrittenExerciseCreateDto implements BaseExercise {
  @IsNotEmpty()
  @IsEnum(ExerciseType, {
    message: `Type must be one of the following values: ${Object.values(ExerciseType).join(', ')}.`,
  })
  @Equals(ExerciseType.Written)
  type: ExerciseType = ExerciseType.Written;

  @IsNotEmpty()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  link?: string;
}

export class McExerciseCreateDto implements BaseExercise {
  @IsNotEmpty()
  @IsEnum(ExerciseType, {
    message: `Type must be one of the following values: ${Object.values(ExerciseType).join(', ')}.`,
  })
  @Equals(ExerciseType.Mc)
  type: ExerciseType = ExerciseType.Mc;

  @IsNotEmpty()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsNotEmpty()
  choices: string[];

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  correctChoiceIdx: number;
}

export type ExerciseCreateDto = McExerciseCreateDto | WrittenExerciseCreateDto;
