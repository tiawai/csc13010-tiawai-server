import { ApiProperty } from '@nestjs/swagger';

export class ChatSessionResponseDto {
    @ApiProperty({ description: 'UUID of the chat session' })
    id: string;

    @ApiProperty({ description: 'User ID associated with the chat session' })
    userId: string;

    @ApiProperty({ description: 'Topic or label for the chat session' })
    topic: string;

    @ApiProperty({ description: 'Flag to indicate if the session is active' })
    isActive: boolean;

    @ApiProperty({ description: 'Timestamp when the chat session was created' })
    createdAt: Date;

    @ApiProperty({
        description: 'Timestamp when the chat session was last updated',
    })
    updatedAt: Date;
}
