import { Router } from "express";

import { getUser, login, signup } from "../controllers/auth.controller";
import { isAuth } from "../middlewares/is-auth";

const router: Router = Router();

router.post("/login", login);

router.post("/signup", signup);

router.get("/user", isAuth, getUser);

export default router;
