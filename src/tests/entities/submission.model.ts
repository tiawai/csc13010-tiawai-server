import {
    BelongsTo,
    Column,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Test } from './test.model';
import { User } from 'src/users/entities/user.model';

@Table({
    tableName: 'submissions',
    timestamps: false,
})
export class Submission extends Model {
    @Column({
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => Test)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tests',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    testId: string;

    @BelongsTo(() => Test)
    test: Test;

    @ForeignKey(() => User)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'accounts',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    userId: string;

    @Column({
        type: DataTypes.DECIMAL,
        allowNull: false,
    })
    score: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    timeConsumed: number;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    submitAt: Date;
}
