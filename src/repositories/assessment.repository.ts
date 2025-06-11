import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Assessment, AssessmentDocument } from 'src/schema/assessment.schema';
import { Assessment as AssessmentSchema } from 'src/schema/assessment.schema';

export interface CreateAssessmentProps
  extends Omit<AssessmentSchema, 'createdAt' | '_id' | '__v'> {}

@Injectable()
export class AssessmentRepository {
  constructor(
    @InjectModel(Assessment.name) private readonly assessmentModel: Model<AssessmentDocument>,
  ) {}

  // TODO: Enable create
  // async create(assessment: CreateAssessmentProps): Promise<Assessment> {
  //   const createdAssessment = new this.assessmentModel(assessment);
  //   return createdAssessment.save();
  // }
}
