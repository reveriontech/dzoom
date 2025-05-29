import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { MyFileService } from "@ejfdelgado/ejflab-back/srv/MyFileService.mjs";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { MyConstants } from "@ejfdelgado/ejflab-common/src/MyConstants.js";
import { uuidv7 } from "uuidv7";
import { Readable } from 'stream';

import { Storage } from '@google-cloud/storage';

const storage = new Storage();

export class IntroSrv {
    static async readByRoomName(req, res, next) {
        const roomName = General.readParam(req, "room_name", null);
        const model = {
            roomName,
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/room_intro_by_room.sql", model);
        // Seleccionamos solo las filas (rows)
        const rows = databaseResponse.rows;
        // Respondemos desde el backend al front end
        res.status(200).send(rows);
    }

    static async readByRoomNameAndType(req, res, next) {
        const roomName = General.readParam(req, "room_name", null);
        const type = General.readParam(req, "type", null);

        let roomNameFiltered = roomName;
        if (roomName instanceof Array) {
            const filtered = roomName.filter((room, index) => {
                return roomName.indexOf(room) == index;
            });
            let roomNameFiltered = filtered;
            if (roomNameFiltered.length == 1) {
                roomNameFiltered = roomNameFiltered[0];
            }
        }
        const model = {
            roomName: roomNameFiltered,
            type,
        };

        let databaseResponse = null;
        if (model.roomName instanceof Array) {
            model.roomName = model.roomName.join("','");
            databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/room_intro_n_by_room_type.sql", model);
        } else {
            databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/read/room_intro_by_room_type.sql", model);
        }
        // Seleccionamos solo las filas (rows)
        const rows = databaseResponse.rows;
        // Respondemos desde el backend al front end
        if (rows.length > 0) {
            res.status(200).send(rows);
        } else {
            res.status(204).send();
        }
    }

    static async write(req, res, next) {
        const roomName = General.readParam(req, "room_name", null);
        const type = General.readParam(req, "type", null);
        const content = General.readParam(req, "content", null);
        const model = {
            roomName,
            type,
            content,
            now: new Date().getTime()
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/write/room_intro.sql", model);

        res.status(200).send({
            message: 'Intro updated',
            rowsUpdated: databaseResponse.rowCount,
        });
    }

    static async delete(req, res, next) {
        const roomName = General.readParam(req, "room_name", null);
        const type = General.readParam(req, "type", null);
        const model = {
            roomName,
            type,
        };
        const databaseResponse = await PostgresSrv.executeFile("srv/nogales/sql/delete/room_intro_by_room_type.sql", model);

        res.status(200).send({
            message: 'Intro deleted',
            rowsUpdated: databaseResponse.rowCount,
        });
    }

    static async uploadFile(req, res, next) {
        MyConstants.overwriteEnvVariables();
        const defaultBucket = storage.bucket(MyConstants.BUCKET.PUBLIC);
        const privateBucket = storage.bucket(MyConstants.BUCKET.PRIVATE);
        console.log("uploadFile...");
        let file = req.files["file"];

        const folder = General.readParam(req, "folder", "");
        const bucket = General.readParam(req, "bucket", "public");
        let filename = General.readParam(req, "filename", "");
        let extension = General.readParam(req, "extension", "");

        if (filename == "") {
            filename = uuidv7();
        }

        let bucketRef = defaultBucket;
        let bucketName = MyConstants.BUCKET.PUBLIC;
        if (bucket == "private") {
            bucketRef = privateBucket;
            bucketName = MyConstants.BUCKET.PRIVATE;
        }

        let bucketUrl = `${folder}/${filename}.${extension}`;
        const bucketRefFile = bucketRef.file(bucketUrl);

        const stream = Readable.from(file[0].buffer);

        const response = await MyFileService.sendFile2Bucket(stream, bucketRefFile);

        res.status(200).send({
            url: `${MyConstants.BUCKET.URL_BASE}/${bucketName}/${bucketUrl}`,
        });
    }
}