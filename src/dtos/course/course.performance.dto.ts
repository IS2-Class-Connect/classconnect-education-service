/**
 * Data Transfer Object (DTO) for course performance summary.
 */
export interface CoursePerformanceDto {
  /** Average grade of completed submissions */
  averageGrade: number,
  /** Current completion rate of submissions */
  completionRate: number,
  /** Number of assessments */
  totalAssessments: number,
  /** Number of submissions */
  totalSubmissions: number,
  /** Rate of open evaluations */
  openRate: number
}
