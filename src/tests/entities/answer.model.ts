import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
    tableName: 'answers',
    timestamps: false,
})
export class Answer extends Model {
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
            model: 'submissions',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    submissionId: string;

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'questions',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    questionId: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    answer: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    declare createdAt: Date;
}
