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
    return createdAssessment.save();
  }

  async findById(id: string): Promise<Assessment | null> {
    return this.assessmentModel.findById(id).exec();
  }

  async findAssessments(filter: AssessmentFilterDto): Promise<Assessment[]> {
    // Elimina las propiedades undefined o null del filtro
    const query: Record<string, any> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query[key] = value;
      }
    });
    return this.assessmentModel.find(query).exec();
  }

  async findByCourseId(courseId: number): Promise<Assessment[]> {
    return this.assessmentModel.find({ courseId }).exec();
  }

  async update(
    id: string,
    updateData: Partial<Omit<CreateAssessmentProps, 'courseId' | 'teacherId' | 'userId' | 'type'>>,
  ): Promise<Assessment | null> {
    const updatedAsess = await this.assessmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedAsess) {
      throw new NotFoundException(`Assessment with ID ${id} not found.`);
    }
    return updatedAsess;
  }

  async delete(id: string): Promise<Assessment | null> {
    const deletedAssessment = await this.assessmentModel.findByIdAndDelete(id).exec();
    if (!deletedAssessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found.`);
    }
    return deletedAssessment;
  }
}

const logger = new Logger(AssessmentRepository.name);
