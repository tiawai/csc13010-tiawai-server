import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
    tableName: 'assignments',
    timestamps: true,
})
export class Assignment extends Model {
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
            model: 'classrooms',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    classroomId: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    title: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    description: string;

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
    author: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    duration: number;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    openAt: Date;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    dueAt: Date;

    @Column({
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    visible: boolean;
}
