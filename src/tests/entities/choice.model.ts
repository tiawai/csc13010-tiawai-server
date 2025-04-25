import { DataTypes } from 'sequelize';
import { Column, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'choices',
    timestamps: false,
})
export class Choice extends Model {
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
            model: 'questions',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    questionId: string;

    @Column({
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    })
    A: string;

    @Column({
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    })
    B: string;

    @Column({
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    })
    C: string;

    @Column({
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    })
    D: string;
}
