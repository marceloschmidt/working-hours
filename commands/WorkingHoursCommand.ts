import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { WorkingHours } from '../actions/WorkingHours';
import { ErrorsEnum } from '../enum/Errors';

import { notifyUser } from '../helpers/message';
import { WorkingHoursApp } from '../WorkingHoursApp';

export class WorkingHoursCommand implements ISlashCommand {
    public command = 'workinghours';
    public i18nParamsExample = 'Params';
    public i18nDescription = 'Description';
    public providesPreview = false;

    constructor(private readonly app: WorkingHoursApp) { }
    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
        try {
            // this.app.modify = modify;
            const [command] = context.getArguments();

            switch (command) {
                // WHAT A TERRIBLE HACK
                // I AM VERY ASHAMED OF DOING IT
                case 'status':
                    await notifyUser({ app: this.app, read, modify, room: context.getRoom(), user: context.getSender(), text: this.app.modify ? 'Active' : 'Inactive' });
                    break;
                default:
                    await WorkingHours.run({ app: this.app, context, read, modify });
                    break;
            }
        } catch (error) {
            await notifyUser({
                app: this.app,
                read,
                modify,
                room: context.getRoom(),
                user: context.getSender(),
                text: error.message || ErrorsEnum.OPERATION_FAILED,
            });
            this.app.getLogger().error(error.message);
        }
    }
}
