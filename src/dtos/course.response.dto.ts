/**
 * Data Transfer Object (DTO) for retreiving a Course.
 */
export interface CourseResponseDTO {
  /** ID of the course */
  id: number;
  /** Title of the course */
  title: string;
  /** Description of the course */
  description: string;
}
