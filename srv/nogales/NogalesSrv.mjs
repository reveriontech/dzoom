import { commonHeaders, handleErrorsDecorator } from "@ejfdelgado/ejflab-back/srv/Network.mjs";
import { checkAuthenticated, checkAuthenticatedSilent } from "@ejfdelgado/ejflab-back/srv/common/FirebasConfig.mjs";
import { AuthorizationSrv } from "@ejfdelgado/ejflab-back/srv/AuthorizationSrv.mjs";
import { MyConstants } from "@ejfdelgado/ejflab-common/src/MyConstants.js";
import * as multer from 'multer';
import { VideoCallSrv } from "./VideoCallSrv.mjs";
import express from "express";
import { IntroSrv } from "./IntroSrv.mjs";
import { SMSSrv } from "./SMSService.mjs";
import { UserSrv } from "./UserSrv.mjs";
import { RoomSrv } from "./RoomSrv.mjs";

MyConstants.overwriteEnvVariables();

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const upload = multer.default({
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        fieldSize: MAX_FILE_SIZE_BYTES,
    },
});

export class NogalesSrv {
    static configure(app) {
        app.get('/srv/nogales/test', [commonHeaders,
            handleErrorsDecorator(VideoCallSrv.test)]);
        app.post('/srv/nogales/geolocate', [commonHeaders, express.json(),
            handleErrorsDecorator(VideoCallSrv.getMyIp)]);
        app.post('/srv/nogales/update_photo', [commonHeaders, express.json(),
            handleErrorsDecorator(VideoCallSrv.updatePhoto)]);
        app.get('/srv/nogales/get_photo/:socketId', [commonHeaders,
            handleErrorsDecorator(VideoCallSrv.getPhoto)]);

        // Intro
        app.get('/srv/nogales/intro/room', [commonHeaders,
            handleErrorsDecorator(IntroSrv.readByRoomName)]);
        app.get('/srv/nogales/intro/room_type', [commonHeaders,
            handleErrorsDecorator(IntroSrv.readByRoomNameAndType)]);
        app.post('/srv/nogales/intro/room_type', [commonHeaders, checkAuthenticatedSilent,
            AuthorizationSrv.isUserInAllGroup(["apps_videocall_admin"]), express.json(),
            handleErrorsDecorator(IntroSrv.write)]);
        app.delete('/srv/nogales/intro/room_type', [commonHeaders, checkAuthenticatedSilent,
            AuthorizationSrv.isUserInAllGroup(["apps_videocall_admin"]), express.json(),
            handleErrorsDecorator(IntroSrv.delete)]);

        const multipartFile = upload.fields([
            { name: "file", maxCount: 1 },
        ]);
        app.post("/srv/nogales/upload", [commonHeaders, multipartFile,
            handleErrorsDecorator(IntroSrv.uploadFile),]);

        // sms
        app.get('/srv/nogales/sms/user', [commonHeaders,
            AuthorizationSrv.isUserInAllGroup(["apps_videocall_admin"]),
            handleErrorsDecorator(SMSSrv.getUser)]);
        app.get('/srv/nogales/sms/inbox', [commonHeaders,
            AuthorizationSrv.isUserInAllGroup(["apps_videocall_admin"]),
            handleErrorsDecorator(SMSSrv.getInbox)]);
        app.get('/srv/nogales/sms/send', [commonHeaders,
            AuthorizationSrv.isUserInAllGroup(["apps_videocall_admin", "apps_videocall_provider"]),
            handleErrorsDecorator(SMSSrv.send)]);

        // User
        app.get('/srv/nogales/user/own', [commonHeaders, checkAuthenticated,
            handleErrorsDecorator(UserSrv.getOwnUser)]);
        app.get('/srv/nogales/user/paginate', [commonHeaders, checkAuthenticated,
            handleErrorsDecorator(UserSrv.paginate)]);
        app.post('/srv/nogales/user/own', [commonHeaders, checkAuthenticated, express.json(),
            handleErrorsDecorator(UserSrv.updateCreateOwnUser)]);
        app.get('/srv/nogales/user_detail/own', [commonHeaders, checkAuthenticated,
            handleErrorsDecorator(UserSrv.getOwnUserDetail)]);
        app.post('/srv/nogales/user_detail/own', [commonHeaders, checkAuthenticated, express.json(),
            handleErrorsDecorator(UserSrv.updateCreateOwnUserDetail)]);

        // Room
        app.get('/srv/nogales/room/paginate', [commonHeaders, checkAuthenticated, express.json(),
            handleErrorsDecorator(RoomSrv.paginate)]);
        app.get('/srv/nogales/room/assure_my_room', [commonHeaders, checkAuthenticated, express.json(),
            handleErrorsDecorator(RoomSrv.assureMyRoom)]);
        app.post('/srv/nogales/room/create', [commonHeaders, checkAuthenticated, express.json(),
            handleErrorsDecorator(RoomSrv.updateCreate)]);
        app.delete('/srv/nogales/room/delete', [commonHeaders, checkAuthenticated, express.json(),
            handleErrorsDecorator(RoomSrv.delete)]);

        // User Permissions
        app.get('/srv/nogales/user_room_permission/paginate', [commonHeaders, checkAuthenticated,
            AuthorizationSrv.isUserInSomeGroup(["apps_videocall_admin", "apps_videocall_provider"]),
            handleErrorsDecorator(UserSrv.paginatePermissions)]);
        app.post('/srv/nogales/user_room_permission/update', [commonHeaders, checkAuthenticated,
            AuthorizationSrv.isUserInSomeGroup(["apps_videocall_admin", "apps_videocall_provider"]), express.json(),
            handleErrorsDecorator(RoomSrv.updateUserRoomPermission)]);
    }
}