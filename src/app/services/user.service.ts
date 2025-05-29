import { Injectable } from "@angular/core";
import { HttpService } from "ejflab-front-lib";

export interface UserData {
    user_id: string;
    title: string;
    name: string;
    middle_name: string;
    last_name: string;
    permission_granted: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {

    constructor(
        private httpSrv: HttpService,
    ) { }

    async paginateRoomPermission(roomId: string, sharedRoomPagination: any): Promise<UserData[]> {
        const params: any = {
            room_id: roomId
        };
        Object.assign(params, sharedRoomPagination as any);
        const searchParams = new URLSearchParams(params);
        const response: any = await this.httpSrv.get("srv/nogales/user_room_permission/paginate?" + searchParams.toString());
        return response;
    }

    async updateRoomPermission(roomId: string, userId: string, grant: boolean): Promise<any> {
        const params: any = {
            room_id: roomId,
            user_id: userId,
            grant: grant ? 1 : 0,
        };

        const response: any = await this.httpSrv.post("srv/nogales/user_room_permission/update", params);
        return response;
    }
}