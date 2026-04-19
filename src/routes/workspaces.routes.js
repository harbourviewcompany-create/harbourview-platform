import { Router } from 'express';

export function createWorkspaceRouter({ membershipService }) {
  const router = Router();

  router.get('/memberships', async (req, res, next) => {
    try {
      const memberships = await membershipService.listForUser(req.user, req.user.id);
      res.json({ memberships });
    } catch (error) {
      next(error);
    }
  });

  router.post('/switch', async (req, res, next) => {
    try {
      const result = await membershipService.switchWorkspace(req.user, req.body.workspace_id);

      res.cookie('hv_workspace_id', result.workspaceId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      res.json({ ok: true, active_workspace_id: result.workspaceId, workspace_role: result.workspaceRole });
    } catch (error) {
      next(error);
    }
  });

  router.post('/members', async (req, res, next) => {
    try {
      const membership = await membershipService.inviteMember(req.user, req.body);
      res.status(201).json({ membership });
    } catch (error) {
      next(error);
    }
  });

  router.post('/members/:membershipId/disable', async (req, res, next) => {
    try {
      const membership = await membershipService.disableMember(req.user, req.params.membershipId);
      res.json({ membership });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
