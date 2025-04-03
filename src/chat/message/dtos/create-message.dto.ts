import { IsString, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
    @ApiProperty({ description: 'Chat session ID associated with the message' })
    @IsUUID()
    sessionId: string;

    @ApiProperty({ description: 'Content of the message' })
    @IsString()
    content: string;

    @ApiProperty({
        description: 'Indicates if the message is from the bot',
        default: false,
    })
    @IsBoolean()
    isBot: boolean;
}
