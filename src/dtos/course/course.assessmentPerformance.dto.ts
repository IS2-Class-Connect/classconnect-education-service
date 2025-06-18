// marcos
/**
 * Data Transfer Object (DTO) for student performance summary in an assessment.
 */
export interface AssessmentPerformanceDto {
  /** Title of the assessment */
  title: string,
  /** Average grade of completed submissions */
  averageGrade: number,
  /** Current completion rate of assessments */
  completionRate: number,
}
