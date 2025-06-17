import { Prop, Schema } from '@nestjs/mongoose';

export enum ExerciseType {
  Written,
  Mc,
}

@Schema({ _id: false })
export class WrittenExerciseSchema {
  @Prop({ required: true, enum: ExerciseType })
  type: ExerciseType.Written;

  @Prop({ required: true })
  question: string;

  @Prop({ required: false, type: String })
  link?: string;
}

@Schema({ _id: false })
export class McExerciseSchema {
  @Prop({ required: true, enum: ExerciseType })
  type: ExerciseType.Mc;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  choices: string[];

  @Prop({ required: true })
  correctChoiceIdx: number;

  @Prop({ required: false, type: String })
  link?: string;
}

export type ExerciseSchema = McExerciseSchema | WrittenExerciseSchema;
