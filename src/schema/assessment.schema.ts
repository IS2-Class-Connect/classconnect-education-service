import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Submission } from './submission.schema';

export type AssessmentDocument = Assessment & Document;

export enum AssessmentType {
  Exam = 'Exam',
  Task = 'Task',
}

@Schema()
/**
 * Represents an assessment within an educational course.
 */
export class Assessment {
  /**
   * Title of the assessment. Required.
   */
  @Prop({ required: true })
  title: string;

  /**
   * Optional description of the assessment.
   */
  @Prop()
  description?: string;

  /**
   * Type of the assessment: Exam or Task. Required.
   */
  @Prop({ type: String, enum: AssessmentType, required: true })
  type: AssessmentType;

  /**
   * Identifier of the course to which the assessment belongs. Required.
   */
  @Prop({ required: true, index: true }) // Indexed for fast queries.
  courseId: number;

  /**
   * Identifier of the user (teacher or assistant) who created the assessment. Required.
   */
  @Prop({ required: true })
  userId: string;

  /**
   * Identifier of the teacher of the course that the assessment belongs. Required.
   */
  @Prop({ required: true })
  teacherId: string;

  /**
   * Start date and time of the assessment.
   */
  @Prop({ type: Date })
  startTime: Date;

  /**
   * Deadline date and time for submitting the assessment.
   */
  @Prop({ type: Date })
  deadline: Date;

  /**
   * Time in minutes to tolerate late submissions.
   */
  @Prop({ type: Number, default: 0, min: 0 })
  toleranceTime: number;

  /**
   * The date when the assessment was created.
   */
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  exercises: any[];

  @Prop({ required: false, type: Object })
  submissions?: Record<string, Submission>;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
