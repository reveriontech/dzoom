import geoip from 'geoip-lite';
import { UtilMultiPart } from './UtilMultiPart.mjs';
import { SocketIOCall } from "@ejfdelgado/ejflab-back/srv/SocketIOCall.mjs";

export class VideoCallSrv {
    static async test(req, res, next) {
        const response = {
            now: new Date().getTime(),
        };
        res.status(200).send(response);
    }

    static async getMyIp(req, res, next) {
        const ipRaw = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const response = {
            ipRaw,
        };
        if (!ipRaw) {
            res.status(200).send(response);
            return;
        }
        const ip = ipRaw.split(',').shift();
        const detail = geoip.lookup(ip);
        response['ip'] = ip;
        response['detail'] = detail;
        res.status(200).send(response);
    }

    static async updatePhoto(req, res, next) {
        const socketId = req.body.socketId;
        const base64 = req.body.base64;

        const [prefix, base64Data] = base64.split(',');
        const fileBytes = Buffer.from(base64Data, "base64");
        SocketIOCall.putSocketImage(socketId, fileBytes);
        const response = {};
        res.status(200).send(response);
    }

    static async getPhoto(req, res, next) {
        const socketId = req.params["socketId"];
        const fileBytes = SocketIOCall.getSocketImage(socketId);
        if (fileBytes) {
            const response = {
                "Content-Type": 'image/jpeg',
                "Content-disposition": "inline",
                "Cache-Control": `max-age=1000`,
            };
            res.writeHead(200, response);
            res.end(fileBytes);
        } else {
            res.status(204).send();
        }
    }
}