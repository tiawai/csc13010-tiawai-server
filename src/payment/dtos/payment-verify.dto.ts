import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class PaymentVerifyDto {
    @ApiProperty({
        description: 'Verification code for the payment',
        example: 'ABC123',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: 'Unique identifier for the payment',
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        description: 'Indicates whether the payment was canceled',
        example: false,
    })
    @IsBoolean()
    cancel: boolean;

    @ApiProperty({ description: 'Status of the payment', example: 'SUCCESS' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({
        description: 'Unique order code associated with the payment',
        example: 'ORD20240328XYZ',
    })
    @IsString()
    @IsNotEmpty()
    orderCode: string;
}
