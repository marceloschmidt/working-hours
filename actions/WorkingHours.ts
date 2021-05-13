import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { WorkingHoursModal } from '../modals/WorkingHoursModal';
import { WorkingHoursApp } from '../WorkingHoursApp';

class WorkingHoursAction {
    public async run({ app, context, read, modify }: { app: WorkingHoursApp, context: SlashCommandContext, read: IRead, modify: IModify }): Promise<void> {
        const triggerId = context.getTriggerId();
        if (triggerId) {
            try {
                const modal = await WorkingHoursModal({ modify, read, user: context.getSender() });
                return modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
            } catch (error) {
                console.log(error);
            }
        }
    }
}

export const WorkingHours = new WorkingHoursAction();
