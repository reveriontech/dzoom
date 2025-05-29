import axios from "axios";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";

// https://heymarket.docs.apiary.io/#reference/messages/v1messagesend/send-message?console=1
export class SMSSrv {
    static HEY_MARKET_API_KEY = process.env.HEY_MARKET_API_KEY;
    static HEY_MARKET_SENDER_ID = process.env.HEY_MARKET_SENDER_ID;
    static HEY_MARKET_INBOX_ID = process.env.HEY_MARKET_INBOX_ID;
    static HEY_MARKET_END_POINT = process.env.HEY_MARKET_END_POINT;

    static async getUser(req, res, next) {
        console.log("user...");
        let email = General.readParam(req, "email", null);
        if (!(email instanceof Array)) {
            email = [email];
        }
        const body = {
            email
        };
        const response = await SMSSrv.genericRequest("get", "/v1/users/get", { data: body });
        res.status(200).send(response);
    }

    static async getInbox(req, res, next) {
        console.log("inbox...");
        const body = {};
        const response = await SMSSrv.genericRequest("get", "/v1/inboxes", { data: body });
        res.status(200).send(response);
    }

    static async send(req, res, next) {
        console.log("send...");
        let phone = General.readParam(req, "phone", null);
        let text = General.readParam(req, "text", null);
        const body = {
            "creator_id": parseInt(SMSSrv.HEY_MARKET_SENDER_ID),
            "inbox_id": parseInt(SMSSrv.HEY_MARKET_INBOX_ID),
            "phone_number": phone,
            "text": text,
        };
        const response = await SMSSrv.genericRequest("post", "/v1/message/send", body);
        res.status(200).send(response);
    }

    static async genericRequest(method, path, body) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${SMSSrv.HEY_MARKET_API_KEY}`,
        };
        const options = {
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            headers,
        };
        let response = {};
        if (method == "get") {
            Object.assign(options, body);
            response = await axios[method](`${SMSSrv.HEY_MARKET_END_POINT}${path}`, options);
        } else {
            response = await axios[method](`${SMSSrv.HEY_MARKET_END_POINT}${path}`, body, options);
        }
        return response.data;
    }
}