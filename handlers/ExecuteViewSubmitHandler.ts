import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { WorkingHoursEnum } from '../enum/WorkingHours';
import { clearUIData, persistWorkingHours } from '../helpers/persistence';

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext) {
        const data = context.getInteractionData();
        const state = Object.assign({}, { utcOffset: data.user.utcOffset }, data.view.state);
        if (state[WorkingHoursEnum.VIEW_ID]?.[WorkingHoursEnum.DAYS_ACTION_ID]) {
            state[WorkingHoursEnum.VIEW_ID][WorkingHoursEnum.DAYS_ACTION_ID] = state[WorkingHoursEnum.VIEW_ID][WorkingHoursEnum.DAYS_ACTION_ID].sort((a, b) => a > b ? 1 : -1);
        }
        switch (data.view.id) {
            case WorkingHoursEnum.VIEW_ID: {
                await persistWorkingHours(this.persistence, data.user.id, state);
                await clearUIData(this.persistence, data.user.id);
                break;
            }
        }
        return { success: true } as any;
    }
}
