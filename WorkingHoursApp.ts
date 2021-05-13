import {
    IAppAccessors,
    IAppInstallationContext,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPreMessageSentPrevent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';
import { IUIKitInteractionHandler, IUIKitResponse, UIKitBlockInteractionContext, UIKitViewCloseInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { WorkingHoursCommand } from './commands/WorkingHoursCommand';
import { ErrorsEnum } from './enum/Errors';
import { WorkingHoursEnum } from './enum/WorkingHours';
import { ExecuteBlockActionHandler } from './handlers/ExecuteBlockActionHandler';
import { ExecutePreMessageSentPreventHandler } from './handlers/ExecutePreMessageSentPreventHandler';
import { ExecuteViewClosedHandler } from './handlers/ExecuteViewClosedHandler';
import { ExecuteViewSubmitHandler } from './handlers/ExecuteViewSubmitHandler';
import { notifyUser } from './helpers/message';
import { clearUserChoice } from './helpers/persistence';

export class WorkingHoursApp extends App implements IUIKitInteractionHandler, IPreMessageSentPrevent {
    public modify: IModify;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    // tslint:disable-next-line:max-line-length
    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {
        try {
            const handler = new ExecuteBlockActionHandler(this, read, http, modify, persistence);
            return await handler.run(context);
        } catch (err) {
            console.log(err);
            await notifyUser({ app: this, read, modify, room: context.getInteractionData().room as IRoom, user: context.getInteractionData().user, text: ErrorsEnum.OPERATION_FAILED });
            this.getLogger().log(`${ err.message }`);
            return context.getInteractionResponder().errorResponse();
        }
    }

    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        try {
            const handler = new ExecuteViewSubmitHandler(this, read, http, modify, persistence);
            return await handler.run(context);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
        }
    }

    public async executeViewClosedHandler(context: UIKitViewCloseInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        try {
            const handler = new ExecuteViewClosedHandler(this, read, http, modify, persistence);
            return await handler.run(context);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
        }
    }

    public async checkPreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        return message.room.type === RoomType.DIRECT_MESSAGE;
    }

    public async executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
        try {
            const handler = new ExecutePreMessageSentPreventHandler(this, read, http, this.modify, persistence);
            return await handler.run(message);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
            return false;
        }
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new WorkingHoursCommand(this));
        configuration.scheduler.registerProcessors([
            {
                id: WorkingHoursEnum.CANCEL_JOB,
                processor: async (jobContext, read, modify, http, persistence) => {
                    await clearUserChoice(persistence, jobContext.id, jobContext.roomId);
                },
            },
            {
                id: 'setup',
                startupSetting: {
                    type: StartupType.ONETIME,
                    when: '1 second'
                },
                processor: async (jobContext, read, modify, http, persistence) => {
                    this.modify = modify;
                },
            },
        ]);
    }
}
