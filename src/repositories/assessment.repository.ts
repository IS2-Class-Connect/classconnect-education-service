import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { Assessment, AssessmentDocument } from 'src/schema/assessment.schema';
import { Assessment as AssessmentSchema } from 'src/schema/assessment.schema';

export interface CreateAssessmentProps
  extends Omit<AssessmentSchema, 'createdAt' | '_id' | '__v'> {}

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

  async findAssessments(filter: AssessmentFilterDto): Promise<Assessment[]> {
    // Elimina las propiedades undefined o null del filtro
    const query: Record<string, any> = {};

    // Extraer los valores especiales
    const { startTimeBegin, startTimeEnd, deadlineBegin, deadlineEnd, ...rest } = filter;

    // Clean and add basic fields
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query[key] = value;
      }
    });

    // Add nested fields if necessary
    if (startTimeBegin !== undefined || startTimeEnd !== undefined) {
      query.startTime = {};
      if (startTimeBegin !== undefined) query.startTime.$gte = startTimeBegin;
      if (startTimeEnd !== undefined) query.startTime.$lt = startTimeEnd;
      if (Object.keys(query.startTime).length === 0) delete query.startTime;
    }

    if (deadlineBegin !== undefined || deadlineEnd !== undefined) {
      query.deadline = {};
      if (deadlineBegin !== undefined) query.deadline.$gte = deadlineBegin;
      if (deadlineEnd !== undefined) query.deadline.$lt = deadlineEnd;
      if (Object.keys(query.deadline).length === 0) delete query.deadline;
    }
    return (await this.assessmentModel.find(query).exec()).map((assesment) => assesment.toObject());
  }

  async findByCourseId(courseId: number): Promise<Assessment[]> {
    return (await this.assessmentModel.find({ courseId }).exec()).map((assessment) =>
      assessment.toObject(),
    );
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
}

const logger = new Logger(AssessmentRepository.name);
