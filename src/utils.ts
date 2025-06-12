import { Activity } from '@prisma/client';

export function getForbiddenExceptionMsg(
  courseId: number,
  userId: string,
  activity: Activity,
): string {
  switch (activity) {
    case Activity.EDIT_COURSE:
      return `User ${userId} is not authorized to edit course ${courseId}.`;
    case Activity.ADD_MODULE:
      return `User ${userId} is not authorized to add a module to course ${courseId}.`;
    case Activity.EDIT_MODULE:
      return `User ${userId} is not authorized to edit a module in course ${courseId}.`;
    case Activity.DELETE_MODULE:
      return `User ${userId} is not authorized to delete a module from course ${courseId}.`;
    case Activity.ADD_EXAM:
      return `User ${userId} is not authorized to add an exam to course ${courseId}.`;
    case Activity.EDIT_EXAM:
      return `User ${userId} is not authorized to edit an exam in course ${courseId}.`;
    case Activity.DELETE_EXAM:
      return `User ${userId} is not authorized to delete an exam from course ${courseId}.`;
    case Activity.GRADE_EXAM:
      return `User ${userId} is not authorized to grade an exam in course ${courseId}.`;
    case Activity.ADD_TASK:
      return `User ${userId} is not authorized to add a task to course ${courseId}.`;
    case Activity.EDIT_TASK:
      return `User ${userId} is not authorized to edit a task in course ${courseId}.`;
    case Activity.DELETE_TASK:
      return `User ${userId} is not authorized to delete a task from course ${courseId}.`;
    case Activity.GRADE_TASK:
      return `User ${userId} is not authorized to grade a task in course ${courseId}.`;
    default:
      return `User ${userId} is not authorized to perform this action on course ${courseId}.`;
  }
}
