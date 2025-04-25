import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBankAccountDto {
    @ApiProperty({
        description: 'Account number of the bank account',
        example: '123456789',
    })
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @ApiProperty({
        description: 'Account holder name of the bank account',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    accountHolderName: string;

    @ApiProperty({
        description: 'Bank name of the bank account',
        example: 'Bank of America',
    })
    @IsString()
    @IsNotEmpty()
    bankName: string;
}
