import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { BlockElementType, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { AppEnum } from '../enum/App';
import { ViewHoursEnum } from '../enum/ViewHours';
import { WorkingHoursEnum } from '../enum/WorkingHours';
import { notifyUser } from '../helpers/message';
import { clearUserChoice, getUserChoice, getWorkingHours } from '../helpers/persistence';

export class ExecutePreMessageSentPreventHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) {}

    public async run(message: IMessage): Promise<boolean> {
        let prevent = false;
        const userIds = message.room.userIds;
        if (userIds) {
            const checkUser = userIds[userIds.indexOf(message.sender.id) === 0 ? 1 : 0];
            if (checkUser) {
                const workingHours = await getWorkingHours(this.read.getPersistenceReader(), checkUser);
                if (workingHours?.[WorkingHoursEnum.ID]?.[WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID] === 'Yes') {
                    const sendAnyway = await getUserChoice(this.read.getPersistenceReader(), message.sender.id, message.room.id);
                    // Checks if user has clicked to send message anyway in the past TIMEOUT_MINUTES
                    const now = new Date();
                    if (sendAnyway?.sendMessage) {
                        if ((now.getTime() - sendAnyway.timestamp) / (1000 * 60) > parseInt(AppEnum.TIMEOUT_MINUTES, 10)) {
                            await clearUserChoice(this.persistence, message.sender.id, message.room.id);
                        } else {
                            return false;
                        }
                    }

                    const utcOffset = workingHours.utcOffset;
                    const days = workingHours[WorkingHoursEnum.ID][WorkingHoursEnum.DAYS_ACTION_ID];
                    if (days && days.length > 0) {
                        const serverDate = new Date();
                        const destinationDate = new Date(new Date().setUTCHours(serverDate.getUTCHours() + utcOffset));
                        const destinationDay = destinationDate.getDay().toString();
                        const destinationTime = `${('00' + destinationDate.getHours()).slice(-2)}:${('00' + destinationDate.getMinutes()).slice(-2)}`;
                        if (days.indexOf(destinationDay) !== -1) {
                            const destinationFromTime = workingHours[WorkingHoursEnum.ID][`${ WorkingHoursEnum.FROM_ACTION_ID }#${destinationDay}`];
                            const destinationToTime = workingHours[WorkingHoursEnum.ID][`${ WorkingHoursEnum.TO_ACTION_ID }#${destinationDay}`];
                            console.log(destinationFromTime, destinationTime, destinationToTime, destinationFromTime < destinationTime, destinationToTime > destinationTime);
                            if (destinationFromTime > destinationTime || destinationToTime < destinationTime) {
                                prevent = true;
                            }
                        } else {
                            prevent = true;
                        }
                    } else {
                        prevent = true;
                    }
                }
            }
        }

        if (prevent) {
            const blocks = this.modify.getCreator().getBlockBuilder();
            blocks.addSectionBlock({
                text: {
                    type: TextObjectType.MARKDOWN,
                    text: AppEnum.MESSAGE_PREVENTED,
                },
            });
            blocks.addActionsBlock({
                elements: [{
                    type: BlockElementType.BUTTON,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: WorkingHoursEnum.SEND_MESSAGE_LABEL,
                    },
                    value: message.text,
                    actionId: WorkingHoursEnum.SEND_MESSAGE_ACTION_ID,
                } as IButtonElement,
                {
                    type: BlockElementType.BUTTON,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: ViewHoursEnum.VIEW_WORKING_HOURS,
                    },
                    value: message.text,
                    actionId: ViewHoursEnum.ACTION,
                } as IButtonElement,
                ],
            });

            await notifyUser({ app: this.app, read: this.read, modify: this.modify, room: message.room, user: message.sender, blocks });
        }
        return prevent;
    }
}
