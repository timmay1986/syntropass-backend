import type { Request, Response } from 'express';
import { tokenService } from './token.service.js';
import { createTokenSchema } from './token.types.js';

export const tokenController = {
  async createToken(req: Request, res: Response) {
    const input = createTokenSchema.parse(req.body);
    const result = await tokenService.createToken(
      req.user!.tenantId,
      req.user!.userId,
      input,
    );
    res.status(201).json(result);
  },

  async listTokens(req: Request, res: Response) {
    const tokens = await tokenService.listTokens(req.user!.tenantId, req.user!.userId);
    res.json(tokens);
  },

  async revokeToken(req: Request, res: Response) {
    const id = req.params.id as string;
    await tokenService.revokeToken(id, req.user!.tenantId);
    res.status(204).send();
  },
};
