import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { WorkingHours } from '../actions/WorkingHours';
import { AppEnum } from '../enum/App';
import { ErrorsEnum } from '../enum/Errors';

import { notifyUser } from '../helpers/message';
import { getWorkingHours } from '../helpers/persistence';
import { ViewHoursModal } from '../modals/ViewHoursModal';
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
            const [command, ...args] = context.getArguments();

            switch (command) {
                case 'view':
                    const username = args[0].replace(/^@/, '');
                    this.app.getLogger().log('View ->', username);
                    const user = await read.getUserReader().getByUsername(username);
                    if (user) {
                        const workingHours = await getWorkingHours(read.getPersistenceReader(), user.id);
                        if (workingHours?.workingHours?.useWorkingHours === 'Yes') {
                            const triggerId = context.getTriggerId();
                            if (triggerId) {
                                const modal = await ViewHoursModal({ modify, data: Object.assign({ user }, workingHours) });
                                return modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
                            }
                        } else {
                            await notifyUser({ app: this.app, read, modify, room: context.getRoom(), user: context.getSender(), text: AppEnum.WORKING_HOURS_NOT_SET });
                            return;
                        }
                    } else {
                        await notifyUser({ app: this.app, read, modify, room: context.getRoom(), user: context.getSender(), text: ErrorsEnum.USER_NOT_FOUND });
                        return;
                    }
                default:
                    this.app.modify = modify;
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
