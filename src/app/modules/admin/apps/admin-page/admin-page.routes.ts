import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { TeacherService } from '../teachers/teacher.service';
import { catchError, tap, throwError } from 'rxjs';
import { AproveTeachersComponent } from './aprove-teachers/aprove-teachers.component';
import { AdminPageComponent } from './admin-page.component';

export const TeacherResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const teacherService = inject(TeacherService);
    const router = inject(Router);

    return teacherService.getAllTeachers().pipe(
        tap((res) => console.log('RESPOSTA PROFESSORES:', res)),
        catchError((error) => {
            console.error('Erro ao carregar professores:', error);
            router.navigateByUrl('/');
            return throwError(() => error);
        })
    );
};

export default [
    {
        path: '',
        component: AdminPageComponent,
        children: [
            {
                path: '',
                component: AproveTeachersComponent,
                resolve: {
                    teachers: TeacherResolver
                }
            }
        ]
    }
] as Routes;