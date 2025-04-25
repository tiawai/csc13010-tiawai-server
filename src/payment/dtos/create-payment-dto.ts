import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { PaymentType } from '../entities/payment.model';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'Optional classroom ID associated with the payment',
        example: 'classroom123',
    })
    @IsString()
    @IsOptional()
    classroomId?: string;

    @ApiProperty({
        description: 'Optional teacher ID associated with the payment',
        example: 'teacher456',
    })
    @IsString()
    @IsOptional()
    teacherId?: string;

    @ApiProperty({
        description: 'Type of the payment',
        example: 'CREDIT_CARD',
    })
    @IsString()
    @IsNotEmpty()
    type: PaymentType;

    @ApiProperty({
        description: 'Amount of the payment',
        example: 100.5,
    })
    @IsNumber()
    @IsNotEmpty()
    amount: number;
}
