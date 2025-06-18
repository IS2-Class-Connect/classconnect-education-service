// marcos
/**
 * Data Transfer Object (DTO) for student performance summary in a course.
 */
export interface StudentPerformanceInCourseDto {
  /** Average grade of completed submissions */
  averageGrade: number,
  /** Number of completed submissions */
  completedAssessments: number,
  /** Number of assessments */
  totalAssessments: number,
}
