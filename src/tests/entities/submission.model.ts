import { Model } from 'sequelize';
import { Column, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

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

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
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
