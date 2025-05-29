import { Component, OnDestroy, OnInit } from "@angular/core";
import { ChatManagerComponent } from "./ChatManager.component";
import { CardType, IntroDetailData, IntroMasterData } from '../room-intro/room-intro.component';
import sortify from '@ejfdelgado/ejflab-common/src/sortify';
import { PopupIntroComponent } from '../popup-intro/popup-intro.component';

export interface StateData {
    name: string | null;
}

@Component({
    selector: 'app-intro-manager',
    template: ` <div></div> `,
    styles: [],
})
export abstract class IntroManagerComponent
    extends ChatManagerComponent {

    viewState: string | null = null;
    editIntroType: string = "";
    topIntro: IntroMasterData = {
        list: [],
        created: 0,
        updated: 0
    };
    bottomIntro: IntroMasterData = {
        list: [],
        created: 0,
        updated: 0
    };
    popUpIntro: IntroMasterData = {
        list: [],
        created: 0,
        updated: 0
    };

    editableIntro: Array<IntroDetailData> | null = null;
    memento: string = "";
    mementoChanged: boolean = false;
    selectedPath: string = '';

    async getMemento() {
        this.memento = await this.computeMemento();
    }

    async computeMemento() {
        if (this.editableIntro) {
            return sortify(await this.marshal(this.editableIntro, "", "", false));
        } else {
            return "[]";
        }
    }

    async introChanged(event: any) {
        await this.checkMementoChanged();
    }

    async checkMementoChanged() {
        const actual = await this.computeMemento();
        this.mementoChanged = actual != this.memento;
        //console.log(`mementoChanged=${this.mementoChanged}`);
        this.cdr.detectChanges();
    }

    selectView(state: string) {
        this.viewState = state;
        this.updateHash();
    }

    setViewState(state: StateData) {
        this.viewState = state.name;
        this.updateHash();
    }


    async blobUrlToBytes(blobUrl_: string) {
        var xhr = new XMLHttpRequest;
        xhr.responseType = 'blob';

        const response = new Promise((resolve, reject) => {
            xhr.onload = function () {
                var recoveredBlob = xhr.response;
                const reader = new FileReader();
                // This fires after the blob has been read/loaded.
                reader.addEventListener('loadend', (e: any) => {
                    const blob = new Uint8Array(e.target.result);
                    // calling the save method
                    resolve(blob);
                });
                //
                reader.addEventListener("error", (event) => {
                    reject(event);
                });
                // Start reading the blob as text.
                reader.readAsArrayBuffer(recoveredBlob);
            };
        });

        // get the blob through blob url 
        xhr.open('GET', blobUrl_);
        xhr.send();
        return response;
    }

    async marshal(input: Array<IntroDetailData>, room: string, type: string, autoUpload: boolean = true) {
        const response: any = [];
        for (let i = 0; i < input.length; i++) {
            const actual = input[i];
            const nuevo: IntroDetailData = {
                type: CardType.text,
                value: "",
                confirmed: true,
            };
            nuevo.type = actual.type;
            if (actual.type == CardType.text) {
                if (typeof actual.value == "object" && actual.value != null && "changingThisBreaksApplicationSecurity" in actual.value) {
                    nuevo.value = actual.value['changingThisBreaksApplicationSecurity'] as string;
                } else if (typeof actual.value == "string") {
                    nuevo.value = actual.value;
                }
            } else if (actual.type == CardType.image) {
                const objectUrl = actual.value;
                if (/^blob:/.exec(objectUrl) != null) {
                    if (autoUpload) {
                        const blob: any = await this.blobUrlToBytes(objectUrl);
                        const formData = new FormData();
                        formData.append('folder', `intro/${room}/${type}`);
                        formData.append('bucket', `public`);
                        formData.append('extension', `jpg`);
                        formData.append('file', new File([blob], "somefilename.jpg", { type: blob.type }));
                        const response = await this.httpSrv.post<any>(`/srv/nogales/upload`, formData);
                        nuevo.value = response.url;
                    } else {
                        nuevo.value = objectUrl;
                    }
                } else {
                    nuevo.value = objectUrl;
                }
            } else if (actual.type == CardType.video) {
                if (typeof actual.value == "string") {
                    nuevo.value = actual.value;
                } else if (typeof actual.value == "object" && actual.value != null && "changingThisBreaksApplicationSecurity" in actual.value) {
                    nuevo.value = actual.value["changingThisBreaksApplicationSecurity"];
                }
            }
            response.push(nuevo);
        }
        return response;
    }

    async saveEditIntro() {
        const room = this.selectedPath;
        if (!this.editableIntro) {
            return;
        }
        const content = JSON.stringify(await this.marshal(this.editableIntro, room, this.editIntroType));
        const model: any = {
            room_name: room,
            type: this.editIntroType,
            content,
        };

        try {
            const response = await this.httpSrv.post<any>(`/srv/nogales/intro/room_type`, model);
            this.getMemento();
            this.checkMementoChanged();
            this.modalService.alert({ title: "Saved intro!", txt: "The intro was stored successfully" })
        } catch (err) {

        }
    }

    async deleteIntro() {
        const confirmed = await this.modalService.confirm({ title: "Warning", txt: "The current intro content will be lost and the default content will be used. Continue?" });
        if (!confirmed) {
            return;
        }
        const room = this.selectedPath;
        if (!this.editableIntro) {
            return;
        }

        try {
            const response = await this.httpSrv.delete<any>(`/srv/nogales/intro/room_type?room_name=${room}&type=${this.editIntroType}`);
            await this.loadEditIntro(this.editIntroType);
            this.getMemento();
            this.checkMementoChanged();
            this.modalService.alert({ title: "Ready", txt: "Default intro is being used" })
        } catch (err) {

        }
    }

    async popupIntro(room: string) {
        this.popUpIntro = await this.loadIntro("popup", room);
        if (this.popUpIntro.list instanceof Array && this.popUpIntro.list.length > 0) {
            // check cookie
            const lastUpdated = this.getCookie("NOGALES_ROOM_INTRO_LAST");
            if (lastUpdated == `${this.popUpIntro.updated}`) {
                // skip
            } else {
                const dialogRef = this.dialog.open(PopupIntroComponent, {
                    data: {
                        popUpIntro: this.popUpIntro.list
                    },
                    //disableClose: true,
                    panelClass: ['popup_1', 'nogalespopup'],
                });
                dialogRef.afterClosed().subscribe((result) => {
                    if (result.skip === true) {
                        this.setCookie("NOGALES_ROOM_INTRO_LAST", `${this.popUpIntro.updated}`);
                    }
                });
            }
        }
    }

    setScrollTop() {
        let viewed: any = document.getElementById('content_no_video_call');
        viewed.scrollTop = -1 * viewed.scrollHeight;
    }

    async loadIntros(room: string) {
        this.topIntro = await this.loadIntro("top", room);
        this.bottomIntro = await this.loadIntro("bottom", room);
    }

    async loadIntro(type: string, room: string): Promise<IntroMasterData> {
        const DEFAULT_ROOM_NAME = 'default';
        let list: IntroDetailData[] = [];
        let created = 0;
        let updated = 0;
        const loaded: any = await this.httpSrv.get(`/srv/nogales/intro/room_type?room_name=${DEFAULT_ROOM_NAME}&room_name=${room}&type=${type}`);
        //Load from database
        if (loaded != null) {
            try {
                let selected: any = null;
                if (loaded.length > 0) {
                    if (loaded.length == 1) {
                        // If only one row, use it
                        selected = loaded[0];
                    } else {
                        // If two rows, prefer the first different from room_name DEFAULT_ROOM_NAME
                        selected = loaded.filter((row: any) => {
                            return row.room_name != DEFAULT_ROOM_NAME;
                        })[0];
                    }
                    const content = selected.content;
                    created = selected.created;
                    updated = selected.updated;
                    list = JSON.parse(content);
                    if (list) {
                        for (let i = 0; i < list.length; i++) {
                            const actual = list[i];
                            if (actual.type == CardType.video) {
                                if (typeof actual.value == "string") {
                                    actual.value = this.sanitizer.bypassSecurityTrustResourceUrl(actual.value);
                                }
                            } else if (actual.type == CardType.text) {
                                if (typeof actual.value == "string") {
                                    actual.value = this.sanitizer.bypassSecurityTrustHtml(actual.value);
                                }
                            }
                        }
                    }
                }
            } catch (err) { }
        }
        return {
            list,
            created,
            updated
        };
    }

    async loadEditIntro(type: string) {
        // Call backend
        const room = this.selectedPath;
        this.editIntroType = type;
        //Load from database
        const temp = await this.loadIntro(type, room);
        this.editableIntro = temp.list;
        this.getMemento();
        this.viewState = 'edit';
        this.updateHash();
    }

    updateHash() {
        if (this.viewState != null) {
            const hash = `${this.viewState}/${this.selectedPath}${this.editIntroType ? "/" + this.editIntroType : ""}`;
            location.hash = hash;
            const url = new URL(location.href);
        } else {
            location.hash = '';
            this.viewState = null;
            this.editIntroType = "";
        }
    }

    loadState(hash: string) {
        const tokens = hash.split("/");
        this.viewState = tokens[0];
        if (tokens.length >= 2) {
            this.selectedPath = tokens[1];
        }
        if (tokens.length >= 3) {
            this.editIntroType = tokens[2];
            this.loadEditIntro(this.editIntroType);
        }
        this.cdr.detectChanges();
    }
}