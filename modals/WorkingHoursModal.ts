import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { BlocksEnum } from '../enum/Blocks';
import { WorkingHoursEnum } from '../enum/WorkingHours';
import { getUIData, getWorkingHours } from '../helpers/persistence';
import { weekDays } from '../helpers/weekDays';

export async function WorkingHoursModal({ modify, read, user }: {
    modify: IModify,
    read: IRead,
    user: IUser,
    data?: any,
}): Promise<IUIKitModalViewParam> {
    const viewId = WorkingHoursEnum.VIEW_ID;
    const uiData = (await getUIData(read.getPersistenceReader(), user.id))
                   || ((await getWorkingHours(read.getPersistenceReader(), user.id))?.[WorkingHoursEnum.VIEW_ID])
                   || {};

    const block = modify.getCreator().getBlockBuilder();

    block.addSectionBlock({text: block.newMarkdownTextObject(`*${ WorkingHoursEnum.USE_WORKING_HOURS }*`)});
    block.addActionsBlock({
        blockId: WorkingHoursEnum.VIEW_ID,
        elements: [
            block.newStaticSelectElement({
                actionId: WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID,
                placeholder: block.newPlainTextObject(WorkingHoursEnum.USE_WORKING_HOURS),
                options: [{ text: { type: TextObjectType.PLAINTEXT, text: 'Yes' }, value: 'Yes' }, { text: { type: TextObjectType.PLAINTEXT, text: 'No' }, value: 'No' }],
                initialValue: uiData[WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID] || 'No',
            }),
        ],
    });

    if (uiData[WorkingHoursEnum.USE_WORKING_HOURS_ACTION_ID] === 'Yes') {
        block.addSectionBlock({text: block.newMarkdownTextObject(`*${ WorkingHoursEnum.DAYS_LABEL }*`)});
        block.addActionsBlock({
            blockId: WorkingHoursEnum.VIEW_ID,
            elements: [
                block.newMultiStaticElement({
                    actionId: WorkingHoursEnum.DAYS_ACTION_ID,
                    placeholder: {
                        text: WorkingHoursEnum.DAYS_LABEL,
                        type: TextObjectType.PLAINTEXT,
                    },
                    options: weekDays.map(((day) => ({ text: { type: TextObjectType.PLAINTEXT, text: day.text }, value: day.value }))),
                    initialValue: uiData[WorkingHoursEnum.DAYS_ACTION_ID] || [],
                }),
            ],
        });

        if (uiData[WorkingHoursEnum.DAYS_ACTION_ID]) {
            const hours: Array<any> = [];
            for (let i = 0; i < 24; i++) {
                const hour = ('00' + i).slice(-2); //pad number with 0 to the left
                hours.push({ text: { type: TextObjectType.PLAINTEXT, text: `${ hour }:00` }, value: `${ hour }:00` });
                hours.push({ text: { type: TextObjectType.PLAINTEXT, text: `${ hour }:30` }, value: `${ hour }:30` });
            }
            for (const day of uiData[WorkingHoursEnum.DAYS_ACTION_ID]) {
                block.addSectionBlock({text: block.newMarkdownTextObject(`*${ weekDays[day].text }*`)});
                block.addActionsBlock({
                    blockId: WorkingHoursEnum.VIEW_ID,
                    elements: [
                        block.newStaticSelectElement({
                            actionId: `${ WorkingHoursEnum.FROM_ACTION_ID }#${ weekDays[day].value }`,
                            placeholder: block.newPlainTextObject(WorkingHoursEnum.FROM),
                            options: hours,
                            initialValue: uiData[`${WorkingHoursEnum.FROM_ACTION_ID}#${day}`] || '',
                        }),
                        block.newStaticSelectElement({
                            actionId: `${ WorkingHoursEnum.TO_ACTION_ID }#${ weekDays[day].value }`,
                            placeholder: block.newPlainTextObject(WorkingHoursEnum.TO),
                            options: [...hours.slice(1), { text: { type: TextObjectType.PLAINTEXT, text: `23:59` }, value: `23:59` } ],
                            initialValue: uiData[`${WorkingHoursEnum.TO_ACTION_ID}#${day}`] || '',
                        }),
                    ],
                });
            }
        }
    }

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: WorkingHoursEnum.DEFAULT_TITLE,
        },
        submit: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: BlocksEnum.SAVE,
            },
        }),
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: BlocksEnum.CLOSE,
            },
        }),
        blocks: block.getBlocks(),
    };
}
