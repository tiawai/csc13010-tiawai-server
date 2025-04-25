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
    BALANCE = 'BALANCE',
    CLASSROOM = 'CLASSROOM',
}

export enum PayoutStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
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
        allowNull: false,
        unique: true,
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    studentId: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    teacherId: string;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    classroomId: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    amount: number;

    @Column({
        type: DataType.INTEGER,
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
    description: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    paymentLink: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    paymentDate: Date;

    @Column({
        type: DataType.ENUM(...Object.values(PayoutStatus)),
        allowNull: true,
    })
    payoutStatus: PayoutStatus;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    payoutDate: Date;
}
