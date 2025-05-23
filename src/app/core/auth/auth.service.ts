import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { BaseHttpService } from '../base/base-http.service';
import { Student } from 'app/modules/admin/apps/shared/student.types';
import { Teacher } from 'app/modules/admin/apps/shared/teacher.types';
import { Admin } from 'app/modules/admin/apps/shared/admin.types';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseHttpService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private rememberMe: boolean = false;

    constructor(http: HttpClient) {
        super(http);
        this.rememberMe = localStorage.getItem('rememberMe') === 'true';
    }

    signIn(credentials: { email: string; password: string; rememberMe: boolean; roleId: number }): Observable<any> {
        if (this._authenticated) {
            return throwError(() => 'User is already logged in.');
        }

        return this._httpClient.post(`${this.apiUrl}/auth/login`, credentials).pipe(
            switchMap((response: any) => {
                this.rememberMe = credentials.rememberMe;
                localStorage.setItem('rememberMe', String(this.rememberMe));
                localStorage.setItem('roleId', String(credentials.roleId));

                this.accessToken = response.token;
                this._authenticated = true;
                this._userService.user = response.user;
                return of(response);
            }),
            catchError((error) => {
                return throwError(() => 'Falha ao realizar login. Verifique suas credenciais.');
            })
        );
    }

    signInUsingToken(): Observable<any> {
        if (!this.rememberMe) {
            return of(false);
        }

        return this._httpClient
            .post(`${this.apiUrl}/auth/sign-in-with-token`, {
                accessToken: this.accessToken
            })
            .pipe(
                catchError(() => {
                    this.signOut();
                    return of(false);
                }),
                switchMap((response: any) => {
                    this._authenticated = true;
                    this._userService.user = response.user;
                    return of(true);
                })
            );
    }

    signUpStudent(student: Student): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/student`, student).pipe(
            switchMap((response: any) => of(response)),
            catchError(() => {
                return throwError(() => 'Falha ao cadastrar aluno. Verifique os dados.');
            })
        );
    }

    signUpTeacher(teacher: Teacher): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/teacher`, teacher).pipe(
            switchMap((response: any) => of(response)),
            catchError(() => {
                return throwError(() => 'Falha ao cadastrar professor. Verifique os dados.');
            })
        );
    }

    signUpAdmin(user: Admin): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/user`, user).pipe(
            switchMap((response: any) => {
                return of(response);
            }),
            catchError((error) => {
                return throwError(() => 'Falha ao realizar cadastro. Verifique os dados fornecidos.');
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/auth/forgot-password`, { email });
    }

    resetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/auth/reset-password`, data);
    }

    set accessToken(token: string) {
        if (this.rememberMe) {
            localStorage.setItem('accessToken', token);
            sessionStorage.removeItem('accessToken');
        } else {
            sessionStorage.setItem('accessToken', token);
            localStorage.removeItem('accessToken');
        }
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    }

    signOut(): Observable<any> {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('roleId');
        this._authenticated = false;
        return of(true);
    }


    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    check(): Observable<boolean> {
        if (this._authenticated) {
            return of(true);
        }

        const token = this.accessToken;

        if (!token || AuthUtils.isTokenExpired(token) || !this.rememberMe) {
            this.signOut(); // Desconecta o usuário se o token estiver expirado
            return of(false);
        }

        if (this.rememberMe) {
            return this.signInUsingToken(); // Tenta renovar o token automaticamente
        }

        this._authenticated = true;
        return of(true);
    }
}
