import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET home.
 *
 * @return home page | empty.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json({
      status: 200,
      message: "SongBib api is live!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

export default router;
