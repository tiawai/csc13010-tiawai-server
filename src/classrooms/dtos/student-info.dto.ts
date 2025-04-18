import { ApiProperty } from '@nestjs/swagger';

export class StudentInfoDto {
    @ApiProperty({
        description: 'Student ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Student username',
        example: 'johndoe',
    })
    username: string;

    @ApiProperty({
        description: 'Student email',
        example: 'john.doe@example.com',
    })
    email: string;

    @ApiProperty({
        description: 'Student profile image URL',
        example: 'https://example.com/images/profile/user.jpg',
    })
    profileImage: string;

    @ApiProperty({
        description: 'Classroom student relationship ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    classroomStudentId: string;
}
