import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { AssessmentResponseDto } from 'src/dtos/assessment/assessment.response.dto';
import { AssessmentUpdateDto } from 'src/dtos/assessment/assessment.update.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment, AssessmentType } from 'src/schema/assessment.schema';
import { AssessmentService } from 'src/services/assessment.service';
import { getDatesAfterToday } from 'test/utils';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mockCourseRepo: CourseRepository;
  let mockAssesRepo: AssessmentRepository;
  const { startDate, deadline } = getDatesAfterToday();

  beforeEach(() => {
    mockCourseRepo = {
      findById: jest.fn(),
      findEnrollment: jest.fn(),
      createActivityRegister: jest.fn(),
    } as any;
    mockAssesRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAssessments: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new AssessmentService(mockAssesRepo, mockCourseRepo);
  });

  test('Should create an assessment', async () => {
    const courseId = 1;
    const createDto: AssessmentCreateDto = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      startTime: startDate.toISOString(),
      deadline: deadline.toISOString(),
      toleranceTime: 0,
      userId: 'u1',
    };

    const { userId, ...createData } = createDto;

    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      ...createData,
      startTime: startDate,
      deadline,
      courseId,
      teacherId: userId,
      userId,
      createdAt: new Date(),
    };

    // Ignore 'id' as it’s not included in AssessmentResponseDto nor is necessary
    const expected: AssessmentResponseDto = {
      ...assessment,
    };

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({ id: courseId, teacherId: userId });
    (mockAssesRepo.create as jest.Mock).mockResolvedValue(assessment);

    expect(await service.createAssess(courseId, createDto)).toEqual(expected);
    expect(mockCourseRepo.findById).toHaveBeenCalledWith(courseId);
    expect(mockAssesRepo.create).toHaveBeenCalledWith({
      ...createDto,
      startTime: startDate,
      deadline,
      teacherId: userId,
      courseId,
    });
  });

  test('Should throw an exception when trying to create an assessment with non valid values', async () => {
    const courseId = 1;
    const createDto: AssessmentCreateDto = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      startTime: deadline.toISOString(), // startTime must be before deadline
      deadline: deadline.toISOString(),
      toleranceTime: 0,
      userId: 'u1',
    };

    await expect(service.createAssess(courseId, createDto)).rejects.toThrow(BadRequestException);
  });

  test('Should throw an exception when a forbidden user tries to create an assessment', async () => {
    const courseId = 1;
    const forbiddenUser = 'u1';
    const createExamDto: AssessmentCreateDto = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      startTime: startDate.toISOString(),
      deadline: deadline.toISOString(),
      toleranceTime: 0,
      userId: forbiddenUser,
    };
    const createTaskDto: AssessmentCreateDto = {
      ...createExamDto,
      type: AssessmentType.Task,
    };

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({ id: courseId, teacherId: 't1' });
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.createAssess(courseId, createExamDto)).rejects.toThrow(
      ForbiddenUserException,
    );
    await expect(service.createAssess(courseId, createTaskDto)).rejects.toThrow(
      ForbiddenUserException,
    );
  });

  test('Should find the specified assessment', async () => {
    const id = 'a1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: 'u1',
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: 'u1',
      createdAt: new Date(),
    };

    const expected: AssessmentResponseDto = {
      ...assessment,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);

    expect(await service.findAssess(id)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
  });

  test('Should throw an exception when trying to find a non existent assessment', async () => {
    const id = 'a1';
    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(null);

    await expect(service.findAssess(id)).rejects.toThrow(NotFoundException);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
  });

  test('Should get all the assessments matching a specified filter', async () => {
    const filter: AssessmentFilterDto = {
      type: AssessmentType.Exam,
    };

    const assessments: Assessment[] = [
      {
        title: 'Testing exam',
        description: 'Is an exam to use for the tests',
        type: AssessmentType.Exam,
        startTime: startDate,
        deadline,
        toleranceTime: 10,
        courseId: 1,
        userId: 'a1',
        teacherId: 'a1',
        createdAt: new Date(),
      },
    ];

    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    const expected: AssessmentResponseDto[] = [{ ...assessments[0] }];

    expect(await service.getAssessments(filter)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith(filter);
  });

  test('Should find all the assessments belonging to a specific course', async () => {
    const courseId = 1;
    const assessments: Assessment[] = [
      {
        // TODO: complete with exercises and submissions
        title: 'Testing exam',
        description: 'This is an exam for testing purposes',
        type: AssessmentType.Exam,
        toleranceTime: 0,
        userId: 'u1',
        startTime: startDate,
        deadline,
        courseId,
        teacherId: 'u1',
        createdAt: new Date(),
      },
    ];

    const expected: AssessmentResponseDto[] = [
      {
        ...assessments[0],
      },
    ];

    (mockAssesRepo.findByCourseId as jest.Mock).mockResolvedValue(assessments);

    expect(await service.findAssessmentsByCourse(courseId)).toEqual(expected);
    expect(mockAssesRepo.findByCourseId).toHaveBeenCalledWith(courseId);
  });

  test('Should update an existing assessment', async () => {
    const id = 'a1';
    const userId = 'u1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId,
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: userId,
      createdAt: new Date(),
    };

    const updateDto: AssessmentUpdateDto = {
      title: 'Updated testing exam',
      userId,
    };

    const updatedAssessment: Assessment = {
      ...assessment,
      title: updateDto.title ?? assessment.title,
    };

    const expected: AssessmentResponseDto = {
      ...updatedAssessment,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);
    (mockAssesRepo.update as jest.Mock).mockResolvedValue(updatedAssessment);

    expect(await service.updateAssess(id, updateDto)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
    expect(mockAssesRepo.update).toHaveBeenCalledWith(id, { title: updateDto.title });
  });

  test('Should throw an exception when trying to update an assessment with non valid values', async () => {
    const id = 'a1';
    const userId = 'u1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId,
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: userId,
      createdAt: new Date(),
    };

    const updateDto: AssessmentUpdateDto = {
      startTime: deadline.toISOString(),
      userId,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);

    await expect(service.updateAssess(id, updateDto)).rejects.toThrow(BadRequestException);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
    expect(mockAssesRepo.update).not.toHaveBeenCalled();
  });

  test('Should throw an exception when a forbidden user tries to update an assessment', async () => {
    const courseId = 1;
    const forbiddenUser = 'u1';
    const updateDto: AssessmentUpdateDto = {
      title: 'Updated testing assess',
      userId: forbiddenUser,
    };

    (mockAssesRepo.findById as jest.Mock).mockImplementation((id: string) => ({
      courseId,
      teacherId: 't1',
      type: id === 'a1' ? AssessmentType.Exam : AssessmentType.Task,
    }));
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.updateAssess('a1', updateDto)).rejects.toThrow(ForbiddenUserException);
    await expect(service.updateAssess('a2', updateDto)).rejects.toThrow(ForbiddenUserException);
  });

  test('Should delete an assessment', async () => {
    const id = 'a1';
    const userId = 'u1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId,
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: userId,
      createdAt: new Date(),
    };

    const expected: AssessmentResponseDto = {
      ...assessment,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);
    (mockAssesRepo.delete as jest.Mock).mockResolvedValue(assessment);

    expect(await service.deleteAssess(id, userId)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
    expect(mockAssesRepo.delete).toHaveBeenCalledWith(id);
  });

  test('Should throw an exception when a forbidden user tries to delete an assessment', async () => {
    const courseId = 1;
    const forbiddenUser = 'u1';

    (mockAssesRepo.findById as jest.Mock).mockImplementation((id: string) => ({
      courseId,
      teacherId: 't1',
      type: id === 'a1' ? AssessmentType.Exam : AssessmentType.Task,
    }));
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.deleteAssess('a1', forbiddenUser)).rejects.toThrow(ForbiddenUserException);
    await expect(service.deleteAssess('a2', forbiddenUser)).rejects.toThrow(ForbiddenUserException);
  });
});
