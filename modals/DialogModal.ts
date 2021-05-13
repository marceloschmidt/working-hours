import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { AppEnum } from '../enum/App';
import { BlocksEnum } from '../enum/Blocks';

export async function dialogModal({ title, text, modify }: {
    title?: string,
    text: string,
    modify: IModify,
}): Promise<IUIKitModalViewParam> {
    const viewId = 'dialogModal';
    const block = modify.getCreator().getBlockBuilder();
    block.addSectionBlock({
        text: block.newMarkdownTextObject(text),
    });
    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: title || AppEnum.DEFAULT_TITLE,
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
