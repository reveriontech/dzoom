import { AuthorizationSrv } from "@ejfdelgado/ejflab-back/srv/AuthorizationSrv.mjs";
import { MyError } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";

export class UtilMultiPart {
    static async readStreamToBytes(readStream) {
        const buffer = [];
        return new Promise((resolve, reject) => {
            readStream.on("data", (chunk) => {
                buffer.push(chunk);
            });

            readStream.on("end", () => {
                readStream.close();
                resolve(Buffer.concat(buffer));
            });
        });
    }

    static checkUserLoginMatchesText(res, permissions, and, textId, message) {
        const user = res.locals.user;
        const userId = user.email;
        const firstPart = /^([^@]+)@.*/.exec(userId)[1];
        if (firstPart != textId) {
            // Check it is admin
            if (!AuthorizationSrv.isUserInGroupInternal(user, permissions, and)) {
                throw new MyError(message, 403);
            }
        }
    }
}