import { IMessageBuilder, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { BlockBuilder } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppEnum } from '../enum/App';
import { Logs } from '../enum/Logs';
import { WorkingHoursEnum } from '../enum/WorkingHours';

export const notifyRoom = async ({ app, read, modify, room, text, attachments, blocks }: { app: IApp, read: IRead, modify: IModify, room: IRoom, text?: string, attachments?: Array<IMessageAttachment>, blocks?: BlockBuilder }): Promise<void> => {
    const appUser = await read.getUserReader().getAppUser(app.getID());
    if (!appUser) {
        throw new Error(Logs.ERROR_GETTING_APP_USER);
    }
    const msg = modify.getCreator().startMessage()
        .setGroupable(false)
        .setSender(appUser)
        .setRoom(room);

    if (text && text.length > 0) {
        msg.setText(text);
    }
    if (attachments && attachments.length > 0) {
        msg.setAttachments(attachments);
    }
    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return read.getNotifier().notifyRoom(room, msg.getMessage());
};

export const notifyUser = async ({ app, read, modify, room, user, text, attachments, blocks }: { app: IApp, read: IRead, modify: IModify, room: IRoom, user: IUser, text?: string, attachments?: Array<IMessageAttachment>, blocks?: BlockBuilder }): Promise<void> => {
    const appUser = await read.getUserReader().getAppUser(app.getID());
    if (!appUser) {
        throw new Error(Logs.ERROR_GETTING_APP_USER);
    }
    const msg = modify.getCreator().startMessage()
        .setGroupable(false)
        .setSender(appUser)
        .setUsernameAlias(AppEnum.USERNAME_ALIAS)
        .setEmojiAvatar(AppEnum.EMOJI_AVATAR)
        .setRoom(room);

    if (text && text.length > 0) {
        msg.setText(text);
    }
    if (attachments && attachments.length > 0) {
        msg.setAttachments(attachments);
    }
    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return read.getNotifier().notifyUser(user, msg.getMessage());
};

export async function sendMessage({ app, read, modify, room, user, text, attachments, blocks }: { app: IApp, read: IRead, modify: IModify, room: IRoom, user?: IUser, text?: string, attachments?: Array<IMessageAttachment>, blocks?: BlockBuilder }): Promise<void> {
    const appUser = await read.getUserReader().getAppUser(app.getID());
    if (!appUser) {
        throw new Error(Logs.ERROR_GETTING_APP_USER);
    }
    const msg = modify.getCreator().startMessage()
        .setGroupable(false)
        .setSender(user ? user : appUser)
        .setRoom(room);

    if (text && text.length > 0) {
        msg.setText(text);
    }
    if (attachments && attachments.length > 0) {
        msg.setAttachments(attachments);
    }
    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    await modify.getCreator().finish(msg);
}
