import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { AssessmentService } from 'src/services/assessment.service';

@Controller('/assessments')
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  // TODO: Enable endpoints
  // @Post()
  // create(@Body() createAssessmentDto: AssessmentCreateDto) {
  //   return this.service.createAssess(crea);
  // }

  // @Get()
  // findAll() {
  //   return this.service.findAllAssess();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.service.findAssess(id);
  // }
}
