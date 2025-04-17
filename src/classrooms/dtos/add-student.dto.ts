import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddStudentDto {
    @ApiProperty({
        description: 'Student ID to add to the classroom',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    studentId: string;
}
