import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { AppEnum } from '../enum/App';
import { BlocksEnum } from '../enum/Blocks';
import { ViewHoursEnum } from '../enum/ViewHours';
import { WorkingHoursEnum } from '../enum/WorkingHours';
import { weekDays } from '../helpers/weekDays';
export async function ViewHoursModal({ data, modify }: {
    modify: IModify,
    data: any,
}): Promise<IUIKitModalViewParam> {
    const block = modify.getCreator().getBlockBuilder();
    block.addSectionBlock({text: block.newMarkdownTextObject(`*${ ViewHoursEnum.WORKING_HOURS.replace('%s', data.user.name || data.user.username) }*`)});

    const workingHours = data.workingHours;
    if (workingHours.days && workingHours.days.length > 0) {
        for (const day of workingHours.days) {
            block.addSectionBlock({text: block.newMarkdownTextObject(`${ weekDays[day].text }: ${workingHours[WorkingHoursEnum.FROM_ACTION_ID + '#' + day] || '00:00'} to ${workingHours[WorkingHoursEnum.TO_ACTION_ID + '#' + day] || '23:59'}`)});
        }
    } else {
        block.addSectionBlock({text: block.newMarkdownTextObject(`${ ViewHoursEnum.NO_WORKING_HOURS }`)});
    }

    return {
        id: ViewHoursEnum.ID,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: AppEnum.DEFAULT_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: BlocksEnum.DISMISS,
            },
        }),
        blocks: block.getBlocks(),
    };
}
