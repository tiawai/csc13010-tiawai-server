import { ApiProperty } from '@nestjs/swagger';
import {
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
} from 'class-validator';
import { TestType } from '../enums/test-type.enum';

export class CreateTestDto {
    @ApiProperty({ description: 'Title of the test' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Type of the test',
        enum: TestType,
        enumName: 'TestType',
    })
    @IsNotEmpty()
    @IsEnum(TestType)
    type: TestType;

    @ApiProperty({
        description: 'Start date of the test',
        type: Date,
    })
    @IsNotEmpty()
    @IsDate()
    startDate: Date;

    @ApiProperty({
        description: 'End date of the test',
        type: Date,
    })
    @IsNotEmpty()
    @IsDate()
    endDate: Date;

    @ApiProperty({
        description: 'Total questions of the test',
        type: Number,
    })
    @IsNotEmpty()
    @IsNumber()
    totalQuestions: number;

    @ApiProperty({
        description: 'Total time of the test in minutes',
        type: Number,
    })
    @IsNotEmpty()
    @IsNumber()
    timeLength: number;
}

export class CreateTestResponseDto extends CreateTestDto {
    @ApiProperty({ description: 'Id of the test' })
    @IsNotEmpty()
    @IsString()
    id: string;
}
