import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateLessonDto {
    @ApiProperty({
        description: 'ID of the classroom this lesson belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    @IsNotEmpty()
    classId: string;

    @ApiProperty({
        description: 'Title of the lesson',
        example: 'Introduction to Grammar',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'Content of the lesson (supports HTML and markdown)',
        example:
            '<p>This is a <strong>lesson</strong> with <em>rich</em> content</p>',
    })
    @IsString()
    @IsNotEmpty()
    content: string;
}
