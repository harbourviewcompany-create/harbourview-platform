export class WorkspaceMembershipService {
  constructor({ membershipRepository, workspaceRepository, auditRepository }) {
    this.membershipRepository = membershipRepository;
    this.workspaceRepository = workspaceRepository;
    this.auditRepository = auditRepository;
  }

  async listForUser(actor, userId) {
    if (!actor?.id) throw this.#badRequest('Authenticated actor required');
    if (actor.id !== userId && !this.#isElevated(actor)) throw this.#forbidden();
    return this.membershipRepository.listForUser(actor, userId);
  }

  async switchWorkspace(actor, workspaceId) {
    if (!actor?.id) throw this.#badRequest('Authenticated actor required');

    const memberships = await this.membershipRepository.listForUser(actor, actor.id);
    const activeMembership = memberships.find(
      (membership) => membership.workspace_id === workspaceId && membership.membership_status === 'active'
    );

    if (!activeMembership) throw this.#forbidden('Not an active member of that workspace');

    await this.membershipRepository.setDefaultWorkspace(actor, actor.id, workspaceId);

    return {
      workspaceId,
      workspaceRole: activeMembership.workspace_role
    };
  }

  async inviteMember(actor, payload) {
    this.#requireWorkspaceAdmin(actor);

    const workspace = await this.workspaceRepository.findById(actor, actor.workspaceId);
    if (!workspace) throw this.#badRequest('Active workspace not found');

    const membership = await this.membershipRepository.upsert(actor, {
      workspace_id: actor.workspaceId,
      user_id: payload.user_id,
      workspace_role: payload.workspace_role,
      membership_status: payload.membership_status ?? 'invited',
      is_default: false
    });

    await this.auditRepository.insert(actor, {
      workspace_id: actor.workspaceId,
      entity_type: 'workspace_membership',
      entity_id: membership.id,
      action_type: 'invite_member',
      after_payload: membership
    });

    return membership;
  }

  async disableMember(actor, membershipId) {
    this.#requireWorkspaceAdmin(actor);

    const membership = await this.membershipRepository.updateStatus(actor, membershipId, 'disabled');

    await this.auditRepository.insert(actor, {
      workspace_id: actor.workspaceId,
      entity_type: 'workspace_membership',
      entity_id: membership.id,
      action_type: 'disable_member',
      after_payload: membership
    });

    return membership;
  }

  #requireWorkspaceAdmin(actor) {
    if (!actor?.workspaceId || !['owner', 'admin'].includes(actor.workspaceRole)) {
      throw this.#forbidden('Workspace owner or admin required');
    }
  }

  #isElevated(actor) {
    return ['admin', 'owner'].includes(actor?.role) || ['owner', 'admin'].includes(actor?.workspaceRole);
  }

  #badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }

  #forbidden(message = 'Forbidden') {
    const error = new Error(message);
    error.status = 403;
    return error;
  }
}
