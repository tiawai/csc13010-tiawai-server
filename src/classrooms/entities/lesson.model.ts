import { DataTypes } from 'sequelize';
import { Column, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'lessons',
    timestamps: true,
})
export class Lesson extends Model {
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
            model: 'classrooms',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    classId: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    title: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    content: string;
}
