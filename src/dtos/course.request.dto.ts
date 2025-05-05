import { IsString, IsNotEmpty, IsInt, IsDateString } from 'class-validator';

/**
 * Data Transfer Object (DTO) for creating a new Course.
 */
export class CourseRequestDto {
  /** Title of the course */
  @IsString()
  @IsNotEmpty()
  title: string;

  /** Description of the course */
  @IsString()
  @IsNotEmpty()
  description: string;

  /** Start date of the course */
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  /** End date of the course */
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  /** Registration deadline of the course */
  @IsDateString()
  @IsNotEmpty()
  registrationDeadline: string;

  /** Total places of the course */
  @IsInt()
  @IsNotEmpty()
  totalPlaces: number;

  /** ID of the course head teacher */
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  /**
   * Creates an instance of CourseRequestDto.
   * @param title - The title of the course.
   * @param description - The description of the course.
   * @param startDate - The start date of the course.
   * @param endDate - The end date of the course.
   * @param registrationDeadline - The registration deadline of the course.
   * @param totalPlaces - The places available for the course inscription.
   */
  constructor(
    title: string,
    description: string,
    startDate: string,
    endDate: string,
    registrationDeadline: string,
    totalPlaces: number,
    teacherId: string,
  ) {
    this.title = title;
    this.description = description;
    this.startDate = startDate;
    this.endDate = endDate;
    this.registrationDeadline = registrationDeadline;
    this.totalPlaces = totalPlaces;
    this.teacherId = teacherId;
  }
}
