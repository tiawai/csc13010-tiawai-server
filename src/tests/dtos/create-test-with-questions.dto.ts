import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateTestDto } from './create-test.dto';
import { CreateQuestionDto } from './create-question.dto';

export class CreateTestWithQuestionsDto {
    @ApiProperty({
        description: 'Test information',
        type: CreateTestDto,
        example: {
            title: 'TOEIC Mock Test 1',
            type: 'TOEIC',
            startDate: '2025-03-25T07:42:40.039Z',
            endDate: '2025-03-26T07:42:40.039Z',
            totalQuestions: 2,
            timeLength: 120,
        },
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateTestDto)
    test: CreateTestDto;

    @ApiProperty({
        description: 'Array of questions for the test',
        type: [CreateQuestionDto],
        isArray: true,
        example: [
            {
                paragraph: 'In response to increasing customer demand...',
                content: "What is the main purpose of GreenTech's investment?",
                images: ['https://example.com/greentech-logo.jpg'],
                correctAnswer: 'B',
                explanation:
                    'The passage clearly states that the investment is for R&D...',
                points: 5,
                choices: {
                    A: 'To increase their marketing budget',
                    B: 'To develop eco-friendly products and packaging',
                    C: 'To build new manufacturing facilities',
                    D: 'To hire more employees',
                },
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
