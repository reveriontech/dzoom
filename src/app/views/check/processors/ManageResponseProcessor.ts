import { ContextComponent } from 'ejflab-front-lib';
import { BaseProcesor } from 'ejflab-front-lib';
import { PeerOrchestrator } from 'srcJs/PeerOrchestrator';

export class ManageResponseProcessor extends BaseProcesor {
    orchestrator: PeerOrchestrator | null = null;
    constructor(context: ContextComponent) {
        super(context);
        this.orchestrator = new PeerOrchestrator(context);
    }
    async execute(args: any) {
        await this.orchestrator?.execute(args, false);
    }
}
