import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
    tableName: 'classrooms',
    timestamps: true,
})
export class Classroom extends Model {
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
            model: 'accounts',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    teacherId: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    className: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: () => {
            return Math.random().toString(36).substring(2, 7);
        },
    })
    classCode: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    description: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: process.env.DEFAULT_CLASSROOM_IMG,
    })
    backgroundImage: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    maxStudent: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    price: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    totalLessons: number;

    @Column({
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
    })
    avgRating: number;
}
