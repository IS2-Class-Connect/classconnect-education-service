/**
 * Data Transfer Object (DTO) for retreiving a Course.
 */
export interface CourseResponseDto {
  /** ID of the course */
  id: number;
  /** Title of the course */
  title: string;
  /** Description of the course */
  description: string;
  /** Start date of the course */
  startDate: string;
  /** Registration deadline of the course */
  registrationDeadline: string;
  /** End date of the course */
  endDate: string;
  /** Total places available for the course */
  totalPlaces: number;
  /** ID of the course head teacher */
  teacherId: string;
}
