import { Request, Response } from 'express';
import { usersService } from './users.service';

export class UsersController {
  async list(req: Request, res: Response) {
    const result = await usersService.listUsers(req.user.organizationId);
    res.json(result);
  }

  async getProfile(req: Request, res: Response) {
    const result = await usersService.getUserProfile(
      req.user.organizationId,
      req.params.id
    );
    res.json(result);
  }

  async invite(req: Request, res: Response) {
    const result = await usersService.inviteUser(
      req.user.organizationId,
      req.user.id,
      req.body
    );
    res.status(201).json(result);
  }

  async updateRole(req: Request, res: Response) {
    const result = await usersService.updateUserRole(
      req.user.organizationId,
      req.user.id,
      req.params.id,
      req.body.role
    );
    res.json(result);
  }

  async deactivate(req: Request, res: Response) {
    const result = await usersService.toggleUserStatus(
      req.user.organizationId,
      req.user.id,
      req.params.id,
      false
    );
    res.json(result);
  }

  async reactivate(req: Request, res: Response) {
    const result = await usersService.toggleUserStatus(
      req.user.organizationId,
      req.user.id,
      req.params.id,
      true
    );
    res.json(result);
  }
}

export const usersController = new UsersController();
