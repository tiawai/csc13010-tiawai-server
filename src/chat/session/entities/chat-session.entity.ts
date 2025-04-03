import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.model';

@Table({ tableName: 'chat_sessions' })
export class ChatSession extends Model<ChatSession> {
    @ApiProperty({ description: 'UUID of the chat session' })
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ApiProperty({ description: 'User associated with the chat session' })
    @ForeignKey(() => User)
    @Column({ type: DataType.UUID })
    declare userId: string;

    @ApiProperty({ description: 'Flag indicating if the session is active' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare isActive: boolean;

    @ApiProperty({ description: 'Topic or label of the chat session' })
    @Column({ type: DataType.STRING, allowNull: true })
    declare topic: string;

    @ApiProperty({ description: 'Timestamp when the chat session was created' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    declare createdAt: Date;

    @ApiProperty({
        description: 'Timestamp when the chat session was last updated',
    })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    declare updatedAt: Date;
}
