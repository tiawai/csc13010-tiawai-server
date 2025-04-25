import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
    tableName: 'classroom_ratings',
    timestamps: true,
})
export class ClassroomRating extends Model {
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
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    })
    rating: number;
}
