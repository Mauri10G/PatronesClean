import { Router } from "express";
import { AuthRoutes } from "./auth/routes";





export class AppRoutes {



    static get routes(): Router {

        const router = Router();

        //Defini todas mis rutas
        router.use('/api/auth', AuthRoutes.routes);


        return router;
    }
}