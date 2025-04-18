import { DataTypes } from 'sequelize';
import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Classroom } from 'src/classrooms/entities/classroom.model';
import { Test } from './test.model';

@Table({
    tableName: 'classroom_tests',
    timestamps: true,
})
export class ClassroomTests extends Model {
    @Column({
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => Classroom)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    classroomId: string;

    @ForeignKey(() => Test)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    testId: string;
}
