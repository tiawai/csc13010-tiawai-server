import { ApiProperty } from '@nestjs/swagger';

export class TestParticipantRankingDto {
    @ApiProperty({ description: 'Rank position of the participant' })
    rank: number;

    @ApiProperty({ description: 'User ID of the participant' })
    userId: string;

    @ApiProperty({ description: 'Username of the participant' })
    username: string;

    @ApiProperty({ description: 'Email of the participant' })
    email: string;

    @ApiProperty({ description: 'Score of the participant' })
    score: number;

    @ApiProperty({ description: 'Number of correct answers' })
    correctAnswers: number;

    @ApiProperty({ description: 'Total questions in the test' })
    totalQuestions: number;

    @ApiProperty({ description: 'Percentage of correct answers' })
    percentage: number;

    @ApiProperty({ description: 'Time consumed by the participant in seconds' })
    timeConsumed: number;

    @ApiProperty({ description: 'Formatted time consumed (MM:SS)' })
    formattedTime: string;

    @ApiProperty({ description: 'Submission date' })
    submitAt: Date;
}

export class TestRankingResponseDto {
    @ApiProperty({ description: 'Test ID' })
    testId: string;

    @ApiProperty({ description: 'Test title' })
    testTitle: string;

    @ApiProperty({ description: 'Total number of participants' })
    totalParticipants: number;

    @ApiProperty({
        description: 'List of participants with their rankings',
        type: [TestParticipantRankingDto],
    })
    rankings: TestParticipantRankingDto[];
}
