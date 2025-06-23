import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { AssessmentUpdateDto } from 'src/dtos/assessment/assessment.update.dto';
import { CorrectionCreateDto } from 'src/dtos/correction/correction.create.dto';
import { SubmissionCreateDto } from 'src/dtos/submission/submission.create.dto';
import { AssessmentService } from 'src/services/assessment.service';

function validateAssesId(id: string) {
  // validate that 'id' is a valid assessment id format
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new BadRequestException(`ID ${id} is not a valid Assessment ID`);
}

@Controller('/assessments')
export class AssessmentController {
  constructor(private readonly service: AssessmentService) { }

  @Get()
  async getAssessments(@Query() filter: AssessmentFilterDto) {
    logger.log(
      `Getting the assessments that match with ${filter ? `the filters: ${JSON.stringify(filter)}` : 'non filters'}`,
    );
    return await this.service.getAssessments(filter);
  }

  @Get(':id')
  async getAssess(@Param('id') id: string) {
    validateAssesId(id);
    logger.log(`Getting the assessments with ID ${id}`);
    return await this.service.findAssess(id);
  }

  @Patch(':id')
  async updateAssess(@Param('id') id: string, @Body() updateDto: AssessmentUpdateDto) {
    validateAssesId(id);
    logger.log(`Updating the assessment with ID ${id}`);
    return await this.service.updateAssess(id, updateDto);
  }

  @Delete(':id')
  async deleteAssess(@Param('id') id: string, @Query('userId') userId: string) {
    validateAssesId(id);
    if (!userId) throw new BadRequestException("The query parameter 'userId' should be defined");
    logger.log(`Deleting the assessment with ID ${id}, request by user ${userId}`);
    return await this.service.deleteAssess(id, userId);
  }

  @Post(':id/submissions')
  async createSubmission(@Param('id') id: string, @Body() createDto: SubmissionCreateDto) {
    validateAssesId(id);
    logger.log(`Creating submission to assessment ${id}`);
    return this.service.createSubmission(id, createDto);
  }

  @Get(':id/submissions')
  async getAssesSubmissions(@Param('id') id: string) {
    validateAssesId(id);
    logger.log(`Getting all the submissions of assessment ${id}`);
    return this.service.getAssesSubmissions(id);
  }

  @Get(':assesId/submissions/:userId')
  async getAssesSubmission(@Param('assesId') assesId: string, @Param('userId') userId: string) {
    validateAssesId(assesId);
    logger.log(`Getting user ${userId} submission for assessment ${assesId}`);
    return this.service.getAssesSubmission(assesId, userId);
  }

  @Post(':assesId/submissions/:userId/correction')
  async createCorrection(
    @Param('assesId') id: string,
    @Param('userId') userId: string,
    @Body() createDto: CorrectionCreateDto,
  ) {
    validateAssesId(id);
    logger.log(`Creating correction to submission from user ${userId} of assessment ${id}`);
    return this.service.createCorrection(id, userId, createDto);
  }
}

const logger = new Logger(AssessmentController.name);
