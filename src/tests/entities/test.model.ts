import { DataTypes } from 'sequelize';
import { Column, Model, Table } from 'sequelize-typescript';
import { TestType } from '../enums/test-type.enum';

@Table({
    tableName: 'tests',
    timestamps: true,
})
export class Test extends Model {
    @Column({
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    title: string;

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
    author: string;

    @Column({
        type: DataTypes.ENUM(
            TestType.TOEIC_LISTENING,
            TestType.NATIONAL_TEST,
            TestType.ASSIGNMENT,
        ),
        allowNull: false,
    })
    type: TestType;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    startDate: Date;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    endDate: Date;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
    })
    totalQuestions: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 120,
    })
    timeLength: number;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    audioUrl: string;

    @Column({
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    isGenerated: boolean;
}
