import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitResponse, TextObjectType, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AppEnum } from '../enum/App';
import { ErrorsEnum } from '../enum/Errors';
import { ViewHoursEnum } from '../enum/ViewHours';
import { WorkingHoursEnum } from '../enum/WorkingHours';
import { notifyUser, sendMessage } from '../helpers/message';
import { getUIData, getWorkingHours, persistUIData, persistUserChoice } from '../helpers/persistence';
import { weekDays } from '../helpers/weekDays';
import { dialogModal } from '../modals/DialogModal';
import { ViewHoursModal } from '../modals/ViewHoursModal';
import { WorkingHoursModal } from '../modals/WorkingHoursModal';

export class ExecuteBlockActionHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) {}

    public async run(context: UIKitBlockInteractionContext): Promise<IUIKitResponse> {
        const contextData = context.getInteractionData();
        let uiData = (await getUIData(this.read.getPersistenceReader(), contextData.user.id))
                   || ((await getWorkingHours(this.read.getPersistenceReader(), contextData.user.id))?.[WorkingHoursEnum.ID])
                   || {};

        const { actionId, value = '' } = contextData;
        const [action, subAction] = actionId.split('#');
        let data: any = {};

        switch (action) {
            case WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID:
                data = { [WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID]: value };
                break;
            case WorkingHoursEnum.DAYS_ACTION_ID:
                data = {
                    [WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID]: 'Yes',
                    [WorkingHoursEnum.DAYS_ACTION_ID]: weekDays.filter((day) => value.indexOf(day.value) !== -1).map(day => day.value),
                };
                break;
            case WorkingHoursEnum.FROM_ACTION_ID:
                data = uiData[WorkingHoursEnum.FROM_ACTION_ID] ? { [WorkingHoursEnum.FROM_ACTION_ID]: uiData[WorkingHoursEnum.FROM_ACTION_ID] } : { [WorkingHoursEnum.FROM_ACTION_ID]: {} };
                data[WorkingHoursEnum.FROM_ACTION_ID][subAction] = value;
                break;
            case WorkingHoursEnum.TO_ACTION_ID:
                data = uiData[WorkingHoursEnum.TO_ACTION_ID] ? { [WorkingHoursEnum.TO_ACTION_ID]: uiData[WorkingHoursEnum.TO_ACTION_ID] } : { [WorkingHoursEnum.TO_ACTION_ID]: {} };
                data[WorkingHoursEnum.TO_ACTION_ID][subAction] = value;
                break;
            case WorkingHoursEnum.SEND_MESSAGE_ACTION_ID:
                await persistUserChoice(this.persistence, contextData.user.id, contextData.room?.id);
                // tslint:disable-next-line:max-line-length
                const blocks = this.modify.getCreator().getBlockBuilder();
                blocks.addSectionBlock({
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: AppEnum.TIMEOUT_MESSAGE,
                    },
                });
                await notifyUser({ app: this.app, read: this.read, modify: this.modify, room: contextData.room as IRoom, user: contextData.user, blocks });
                // tslint:disable-next-line:max-line-length
                await sendMessage({ app: this.app, read: this.read, modify: this.modify, room: contextData.room as IRoom, user: contextData.user, text: contextData.value });
                return context.getInteractionResponder().successResponse();
            case ViewHoursEnum.ACTION:
                const userIds = contextData.room?.userIds;
                if (userIds) {
                    const destUserId = userIds[userIds.indexOf(contextData.user.id) === 0 ? 1 : 0];
                    const destUser = await this.read.getUserReader().getById(destUserId);
                    data = Object.assign({}, { user: destUser }, await getWorkingHours(this.read.getPersistenceReader(), destUserId));
                    const modal = await ViewHoursModal({ modify: this.modify, data });
                    return context.getInteractionResponder().openModalViewResponse(modal);
                } else {
                    const modal = await dialogModal({ text: ErrorsEnum.OPERATION_FAILED, modify: this.modify });
                    return context.getInteractionResponder().openModalViewResponse(modal);
                }
            default:
                return context.getInteractionResponder().successResponse();
        }

        uiData = Object.assign(uiData, data);
        await persistUIData(this.persistence, contextData.user.id, uiData);
        const modal = await WorkingHoursModal({ modify: this.modify, read: this.read, data, user: contextData.user });
        // tslint:disable-next-line:max-line-length
        this.modify.getUiController().updateModalView(modal, { triggerId: context.getInteractionData().triggerId }, context.getInteractionData().user);
        return context.getInteractionResponder().successResponse();
    }
}
