import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { UIKitViewCloseInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { clearUIData } from '../helpers/persistence';

export class ExecuteViewClosedHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) {}

    public async run(context: UIKitViewCloseInteractionContext) {
        const data = context.getInteractionData();
        await clearUIData(this.persistence, data.user.id);
        return { success: true } as any;
    }
}
