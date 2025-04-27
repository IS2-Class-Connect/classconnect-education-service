/**
 * Interface representing a Course entity.
 */
export interface Course {
  /** Unique identifier of the course */
  id: number;

  /** Title of the course */
  title: string;

  /** Description of the course */
  description: string;

  /** Date of the publication */
  createdAt: Date;
}
