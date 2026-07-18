import { Request, Response } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json(result);
  }

  async me(req: Request, res: Response) {
    res.json({ user: req.user });
  }

  async listUsers(req: Request, res: Response) {
    const result = await authService.listUsers(req.user.organizationId);
    res.json(result);
  }
}

export const authController = new AuthController();
