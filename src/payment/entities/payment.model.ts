import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.model';

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export enum PaymentType {
    CLASSROOM = 'CLASSROOM',
    BALANCE = 'BALANCE',
}

export enum PayoutStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

@Table({
    tableName: 'payments',
    timestamps: true,
})
export class Payment extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    studentId: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true, // Null for BALANCE type payments
    })
    teacherId: string;

    @Column({
        type: DataType.UUID,
        allowNull: true, // Null for BALANCE type payments
    })
    classroomId: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    amount: number;

    @Column({
        type: DataType.BIGINT,
        allowNull: false,
        unique: true,
    })
    orderCode: number;

    @Column({
        type: DataType.ENUM(...Object.values(PaymentStatus)),
        defaultValue: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({
        type: DataType.ENUM(...Object.values(PaymentType)),
        allowNull: false,
    })
    type: PaymentType;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    paymentLink: string;

    // Payout tracking for classroom payments
    @Column({
        type: DataType.ENUM(...Object.values(PayoutStatus)),
        defaultValue: PayoutStatus.PENDING,
    })
    payoutStatus: PayoutStatus;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    payoutDate: Date;
}
