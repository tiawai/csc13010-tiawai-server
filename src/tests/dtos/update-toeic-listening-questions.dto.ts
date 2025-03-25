import {
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateToeicListeningQuestionsDto {
    @ApiProperty({
        description:
            'Array of batch, which is for Part 3, 4 of Visual TOEIC Listening Test',
        example: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    })
    @IsArray()
    @IsOptional()
    @IsNumber({}, { each: true })
    batch?: number[];

    @ApiProperty({
        description: 'Array of image URLs with format question-xxxy',
        example: [
            'question-0011.jpg', // First image of question 1
            'question-0012.jpg', // Second image of question 1
            'question-0013.jpg', // Third image of question 1
            'question-0021.jpg', // First image of question 2
            'question-0022.jpg', // Second image of question 2
        ],
    })
    @IsArray()
    @IsString({ each: true })
    imageUrls: string[];

    @ApiProperty({
        description: 'Array of questions metadata',
        example: [
            {
                questions: [
                    {
                        content: 'What is shown in the image?',
                        correctAnswer: 'B',
                        explanation:
                            'The image shows a business meeting in progress',
                        points: 3.33,
                        choices: {
                            A: 'A person working alone',
                            B: 'A group meeting in conference room',
                            C: 'People having lunch',
                            D: 'An empty office',
                        },
                        questionOrder: 1,
                    },
                    {
                        content:
                            'Where is this conversation likely taking place?',
                        correctAnswer: 'A',
                        explanation:
                            'Based on the office setting visible in the image',
                        points: 3.33,
                        choices: {
                            A: 'In an office building',
                            B: 'At a restaurant',
                            C: 'In a park',
                            D: 'At a school',
                        },
                        questionOrder: 2,
                    },
                    {
                        content: 'What are the people probably discussing?',
                        correctAnswer: 'C',
                        explanation:
                            'The presentation materials and body language suggest a business proposal',
                        points: 3.34,
                        choices: {
                            A: 'Weekend plans',
                            B: 'Weather forecast',
                            C: 'Business proposal',
                            D: 'Lunch menu',
                        },
                        questionOrder: 3,
                    },
                ],
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
