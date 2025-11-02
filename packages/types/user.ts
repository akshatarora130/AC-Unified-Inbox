export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
