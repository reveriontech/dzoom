import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { MyConstants } from "@ejfdelgado/ejflab-common/src/MyConstants.js";

export class UserSrv {
    static async getOwnUserDetail(req, res, next) {
        const principal = res.locals.user;
        let user_id = principal.email;
        const model = {
            user_id,
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/user_detail.sql", model);
        let userDetail = null;
        if (databaseResponse.rows.length > 0) {
            userDetail = databaseResponse.rows[0];
            res.status(200).send(userDetail);
        } else {
            res.status(204).send();
        }
    }
    static async updateCreateOwnUserDetail(req, res, next) {
        // Get user email id
        const principal = res.locals.user;
        let user_id = principal.email;
        const jobTitle = General.readParam(req, "jobTitle", null);

        const model = {
            user_id,
            job_title: jobTitle,
            now: new Date().getTime()
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/write/user_detail.sql", model);

        res.status(200).send({
            message: 'User detail ok',
            rowsUpdated: databaseResponse.rowCount,
        });
    }
    static async getOwnUser(req, res, next) {
        const principal = res.locals.user;
        let user_id = principal.email;
        const model = {
            user_id,
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/user.sql", model);
        let user = null;
        if (databaseResponse.rows.length > 0) {
            user = databaseResponse.rows[0];
            res.status(200).send(user);
        } else {
            res.status(204).send();
        }
    }
    static async updateCreateOwnUser(req, res, next) {
        // Get user email id
        const principal = res.locals.user;
        let user_id = principal.email;
        const title = General.readParam(req, "title", null);
        const name = General.readParam(req, "name", null);
        const middle_name = General.readParam(req, "middle_name", null);
        const last_name = General.readParam(req, "last_name", null);

        const model = {
            user_id,
            title,
            name,
            middle_name,
            last_name,
            now: new Date().getTime()
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/write/user.sql", model);

        res.status(200).send({
            message: 'User ok',
            rowsUpdated: databaseResponse.rowCount,
        });
    }

    static async paginate(req, res, next) {
        const { orderColumn, direction, limit, offset } =
            General.getPaginationArguments(req, "name");
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

        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/users_paginate.sql", model);
        res.status(200).send(databaseResponse.rows);
    }

    static async paginatePermissions(req, res, next) {
        const { orderColumn, direction, limit, offset } =
            General.getPaginationArguments(req, "name");
        const q = General.readParam(req, "q", null);
        const room_id = General.readParam(req, "room_id", null);
        const use_q = (typeof q == "string" && q.trim().length > 0);

        const model = {
            order_column: orderColumn,
            direction,
            limit,
            offset,
            use_q,
            q,
            room_id
        };

        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/users_room_permission_paginate.sql", model);
        res.status(200).send(databaseResponse.rows);
    }
}