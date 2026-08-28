import { SetMetadata } from '@nestjs/common';
import { AppAbility, Action, Subjects } from '../../modules/casl/casl.types';

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;
export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);

// 便捷装饰器：直接指定 Action 与 Target
export const RequireAbility = (action: Action, subject: Subjects) =>
  CheckPolicies((ability: AppAbility) => ability.can(action, subject));
