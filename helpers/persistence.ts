import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

export const persistUIData = async (persistence: IPersistence, id: string, data: any): Promise<void> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#UI`);
    await persistence.updateByAssociation(association, data, true);
};

export const getUIData = async (persistenceRead: IPersistenceRead, id: string): Promise<any> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#UI`);
    const result = await persistenceRead.readByAssociation(association) as Array<any>;
    return result && result.length ? result[0] : null;
};

export const clearUIData = async (persistence: IPersistence, id: string): Promise<void> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#UI`);
    await persistence.removeByAssociation(association);
};

export const persistWorkingHours = async (persistence: IPersistence, id: string, data: any): Promise<void> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#WH`);
    await persistence.updateByAssociation(association, data, true);
};

export const getWorkingHours = async (persistenceRead: IPersistenceRead, id: string): Promise<any> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#WH`);
    const result = await persistenceRead.readByAssociation(association) as Array<any>;
    return result && result.length ? result[0] : null;
};

export const persistUserChoice = async (persistence: IPersistence, id: string, roomId: string | undefined): Promise<void> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#SEND#${ roomId }`);
    await persistence.updateByAssociation(association, { sendMessage: true, timestamp: new Date().getTime() }, true);
};

export const getUserChoice = async (persistenceRead: IPersistenceRead, id: string, roomId: string | undefined): Promise<any> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#SEND#${ roomId }`);
    const result = await persistenceRead.readByAssociation(association) as Array<any>;
    return result && result.length ? result[0] : null;
};

export const clearUserChoice = async (persistence: IPersistence, id: string, roomId: string | undefined): Promise<void> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `${ id }#SEND#${ roomId }`);
    await persistence.removeByAssociation(association);
};
