import { IsString, IsNotEmpty } from "class-validator";

/**
 * Data Transfer Object (DTO) for creating a new Course.
 */
export class CourseRequestDTO {
  /** Title of the course */
  @IsString()
  @IsNotEmpty()
  title: string;

  /** Description of the course */
  @IsString()
  @IsNotEmpty()
  description: string;

  /**
   * Creates an instance of CourseRequestDTO.
   * @param title - The title of the course.
   * @param description - The description of the course.
   */
  constructor(title: string, description: string) {
    this.title = title;
    this.description = description;
  }
}
