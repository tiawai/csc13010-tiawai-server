import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum TransactionType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT',
}

@Table({
    tableName: 'transactions',
    timestamps: true,
})
export class Transaction extends Model {
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    from: string;

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    to: string;

    @Column({
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false,
    })
    amount: number;

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    classroomId: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    orderId: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    paymentId: string;

    @Column({
        type: DataTypes.ENUM(...Object.values(TransactionStatus)),
        allowNull: false,
    })
    status: TransactionStatus;

    @Column({
        type: DataTypes.ENUM(...Object.values(TransactionType)),
        allowNull: false,
    })
    type: TransactionType;

    @Column({
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false,
    })
    balance: number;

    @Column({
        type: DataTypes.DECIMAL(18, 0),
        allowNull: false,
    })
    toBalance: number;

    @Column({
        type: DataTypes.DATE,
        allowNull: true,
    })
    expireAt: Date;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    qrCode: string;

    @Column({
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    })
    declare createdAt: Date;

    @Column({
        type: DataTypes.DATE,
        allowNull: true,
    })
    declare updatedAt: Date;
}
