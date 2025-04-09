import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { ApiProperty } from '@nestjs/swagger';
import { ChatSession } from '../entities/chat-session.entity';

@Table({ tableName: 'messages' })
export class Message extends Model<Message> {
    @ApiProperty({ description: 'UUID of the message' })
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @ApiProperty({ description: 'Chat session the message belongs to' })
    @ForeignKey(() => ChatSession)
    @Column({ type: DataType.UUID })
    sessionId: string;

    @ApiProperty({ description: 'Content of the message' })
    @Column({ type: DataType.TEXT })
    content: string;

    @ApiProperty({ description: 'Indicates if the message is from the bot' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    isBot: boolean;

    @ApiProperty({ description: 'Timestamp when the message was sent' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    timestamp: Date;
}
