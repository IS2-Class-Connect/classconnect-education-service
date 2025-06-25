import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssessmentQueryDto } from 'src/dtos/assessment/assessment.query.dto';
import { Assessment, AssessmentDocument } from 'src/schema/assessment.schema';
import { Assessment as AssessmentSchema } from 'src/schema/assessment.schema';
import { Submission } from 'src/schema/submission.schema';

export interface CreateAssessmentProps
  extends Omit<AssessmentSchema, 'createdAt' | '_id' | '__v' | 'submissions'> {}

type AssessmentQueryByCourse = AssessmentQueryDto & { courseId?: number };

@Injectable()
export class AssessmentRepository {
  constructor(
    @InjectModel(Assessment.name) private readonly assessmentModel: Model<AssessmentDocument>,
  ) {}

  async create(assessment: CreateAssessmentProps): Promise<Assessment> {
    const createdAssessment = new this.assessmentModel(assessment);
    return (await createdAssessment.save()).toObject();
  }

  async findById(id: string): Promise<Assessment | undefined> {
    return (await this.assessmentModel.findById(id).exec())?.toObject();
  }

  async findAssessments({
    page,
    limit,
    startTimeBegin,
    startTimeEnd,
    deadlineBegin,
    deadlineEnd,
    ...rest
  }: AssessmentQueryByCourse): Promise<Assessment[]> {
    // Elimina las propiedades undefined o null del filtro
    const filters: Record<string, any> = {};

    // Clean and add basic fields
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filters[key] = value;
      }
    });

    // Add nested fields if necessary
    if (startTimeBegin !== undefined || startTimeEnd !== undefined) {
      filters.startTime = {};
      if (startTimeBegin !== undefined) filters.startTime.$gte = startTimeBegin;
      if (startTimeEnd !== undefined) filters.startTime.$lt = startTimeEnd;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (Object.keys(filters.startTime).length === 0) delete filters.startTime;
    }

    if (deadlineBegin !== undefined || deadlineEnd !== undefined) {
      filters.deadline = {};
      if (deadlineBegin !== undefined) filters.deadline.$gte = deadlineBegin;
      if (deadlineEnd !== undefined) filters.deadline.$lt = deadlineEnd;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (Object.keys(filters.deadline).length === 0) delete filters.deadline;
    }
    if (page && limit) {
      const skip = (page - 1) * limit;
      return (await this.assessmentModel.find(filters).skip(skip).limit(limit).exec()).map(
        (assesment) => assesment.toObject(),
      );
    } else {
      return (await this.assessmentModel.find(filters).exec()).map((assesment) =>
        assesment.toObject(),
      );
    }
  }

  async update(
    id: string,
    updateData: Partial<Omit<CreateAssessmentProps, 'courseId' | 'teacherId' | 'userId' | 'type'>>,
  ): Promise<Assessment | undefined> {
    const updatedAsess = await this.assessmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedAsess) {
      throw new NotFoundException(`Assessment with ID ${id} not found.`);
    }
    return updatedAsess.toObject();
  }

  async delete(id: string): Promise<Assessment | undefined> {
    const deletedAssessment = await this.assessmentModel.findByIdAndDelete(id).exec();
    if (!deletedAssessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found.`);
    }
    return deletedAssessment.toObject();
  }

  async setAssesSubmission(assesId: string, userId: string, submission: Submission) {
    const updatedAsses = await this.assessmentModel.findOneAndUpdate(
      { _id: assesId },
      { $set: { [`submissions.${userId}`]: submission } },
      { new: true },
    );
    if (!updatedAsses) {
      throw new NotFoundException(`Assessment with ID ${assesId} not found.`);
    }
    if (!updatedAsses.submissions) {
      throw new InternalServerErrorException('Database error: failed to insert submissions.');
    }
    return updatedAsses.submissions[userId];
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger(AssessmentRepository.name);
