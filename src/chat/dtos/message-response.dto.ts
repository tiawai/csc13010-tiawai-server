import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
    @ApiProperty({ description: 'UUID of the message' })
    id: string;

    @ApiProperty({ description: 'Chat session ID associated with the message' })
    sessionId: string;

    @ApiProperty({ description: 'Content of the message' })
    content: string;

    @ApiProperty({ description: 'Indicates if the message is from the bot' })
    isBot: boolean;

    @ApiProperty({ description: 'Timestamp when the message was sent' })
    timestamp: Date;
}
