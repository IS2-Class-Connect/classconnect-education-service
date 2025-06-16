import { Body, Controller, Delete, Get, Logger, Param, Patch, Query } from '@nestjs/common';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { AssessmentUpdateDto } from 'src/dtos/assessment/assessment.update.dto';
import { AssessmentService } from 'src/services/assessment.service';

@Controller('/assessments')
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Get()
  async getAssessments(@Query() filter: AssessmentFilterDto) {
    logger.log(
      `Getting the assessments that match with ${filter ? `the filters: ${JSON.stringify(filter)}` : 'non filters'}`,
    );
    return await this.service.getAssessments(filter);
  }

  @Get(':id')
  async getAssess(@Param('id') id: string) {
    logger.log(`Getting the assessments with ID ${id}`);
    return await this.service.findAssess(id);
  }

  @Patch(':id')
  async updateAssess(@Param('id') id: string, @Body() updateDto: AssessmentUpdateDto) {
    logger.log(`Updating the assessment with ID ${id}`);
    return await this.service.updateAssess(id, updateDto);
  }

  @Delete(':id')
  async deleteAssess(@Param('id') id: string, @Query('userId') userId: string) {
    logger.log(`Deleting the assessment with ID ${id}, request by user ${userId}`);
    return await this.service.deleteAssess(id, userId);
  }
}

const logger = new Logger(AssessmentController.name);
