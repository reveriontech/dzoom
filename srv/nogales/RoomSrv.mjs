import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { MyError } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { MyConstants } from "@ejfdelgado/ejflab-common/src/MyConstants.js";
import { UtilMultiPart } from "./UtilMultiPart.mjs";

export class RoomSrv {
    static async updateCreate(req, res, next) {
        // Get user email id
        const principal = res.locals.user;

        let owner = principal.email;

        const room_id = General.readParam(req, "room_id", null);
        const title = General.readParam(req, "title", null);
        const is_public = parseInt(General.readParam(req, "is_public", null));
        const is_creation = parseInt(General.readParam(req, "is_creation", 1));

        const model = {
            room_id,
            owner,
            title,
            is_public,
            is_creation,
            now: new Date().getTime()
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/write/room.sql", model);

        res.status(200).send({
            message: 'Room ok',
            rowsUpdated: databaseResponse.rowCount,
        });
    }

    static async paginate(req, res, next) {
        const { orderColumn, direction, limit, offset } =
            General.getPaginationArguments(req, "created");
        const q = General.readParam(req, "q", null);
        const use_q = (typeof q == "string" && q.trim().length > 0);

        const model = {
            order_column: orderColumn,
            direction,
            limit,
            offset,
            use_q,
            q
        };

        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/rooms_paginate.sql", model);
        res.status(200).send(databaseResponse.rows);
    }

    static async delete(req, res, next) {
        const room_id = General.readParam(req, "room_id", null);

        const model = {
            room_id
        };

        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/delete/room.sql", model);
        res.status(200).send({
            message: 'Room deleted',
            rowsUpdated: databaseResponse.rowCount,
        });
    }

    static async assureMyRoom(req, res, next) {
        // Get user email id
        const principal = res.locals.user;
        const owner = principal.email;
        const tokens = /([^@]+)@/.exec(owner);
        if (!tokens) {
            throw new MyError(`Authenticated user email is wrong ${owner}`, 400);
        }
        const room_id = tokens[1];

        const model = {
            room_id,
            owner,
            title: room_id,
            is_public: 0,
            is_creation: 0,
            now: new Date().getTime()
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/write/room.sql", model);

        res.status(200).send({
            message: 'Room ok',
            rowsUpdated: databaseResponse.rowCount,
        });
    }

    static async updateUserRoomPermission(req, res, next) {

        const room_id = General.readParam(req, "room_id", null);
        const user_id = General.readParam(req, "user_id", null);
        const grant = parseInt(General.readParam(req, "grant", "0"));

        const errorMessage = `Can't modify ${room_id} room`;
        UtilMultiPart.checkUserLoginMatchesText(res, ["apps_videocall_admin"], true, room_id, errorMessage);

        const model = {
            room_id,
            user_id,
            grant,
            now: new Date().getTime()
        };

        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/write/room_permission.sql", model);
        res.status(200).send({
            message: 'Permission updated',
            rowsUpdated: databaseResponse.rowCount,
        });
    }
}