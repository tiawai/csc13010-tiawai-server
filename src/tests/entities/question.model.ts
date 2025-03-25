import { DataTypes } from 'sequelize';
import { Column, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'questions',
    timestamps: true,
})
export class Question extends Model {
    @Column({
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    questionOrder: number;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    paragraph: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    content: string;

    @Column({
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    })
    images: string[];

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    correctAnswer: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    explanation: string;

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'choices',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    choices: string;

    @Column({
        type: DataTypes.DECIMAL,
        allowNull: false,
    })
    points: number;

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
}
